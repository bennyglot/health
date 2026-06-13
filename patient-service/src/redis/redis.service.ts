import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {
    this.client = new Redis(this.config.getOrThrow<string>('REDIS_URL'));
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err}`));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (err) {
      this.logger.error(`Redis publish failed: ${err}`);
    }
  }
}
