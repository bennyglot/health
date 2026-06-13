import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  readonly client: Redis;
  private readonly subscriber: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {
    const url = this.config.getOrThrow<string>('REDIS_URL');
    this.client = new Redis(url);
    this.subscriber = new Redis(url);
    this.client.on('error', (err) => this.logger.error(`Redis client error: ${err}`));
    this.subscriber.on('error', (err) => this.logger.error(`Redis subscriber error: ${err}`));
  }

  async onModuleInit() {
    await this.subscriber.subscribe('heart-rate:new');
    this.subscriber.on('message', async (_channel: string, patientId: string) => {
      try {
        await this.bustPatientCache(patientId);
      } catch (err) {
        this.logger.error(`Cache bust failed for patient ${patientId}: ${err}`);
      }
    });
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    await this.client.setex(key, ttl, value);
    await this.client.sadd(`analytics:keys:${key.split(':')[1]}`, key);
  }

  private async bustPatientCache(patientId: string): Promise<void> {
    const setKey = `analytics:keys:${patientId}`;
    const keys = await this.client.smembers(setKey);
    if (keys.length) {
      await this.client.del(...keys);
      this.logger.log(`Busted ${keys.length} cache keys for patient ${patientId}`);
    }
    await this.client.del(setKey);
  }
}
