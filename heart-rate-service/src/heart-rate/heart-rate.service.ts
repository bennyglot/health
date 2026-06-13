import { Injectable } from '@nestjs/common';
import { HeartRateRepository } from './heart-rate.repository';
import { RedisService } from '../redis/redis.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { ReadingResponseDto } from './dto/reading-response.dto';
import { HighEventResponseDto } from './dto/high-event-response.dto';

@Injectable()
export class HeartRateService {
  constructor(
    private repo: HeartRateRepository,
    private redis: RedisService,
  ) {}

  getByPatient(patientId: string): Promise<ReadingResponseDto[]> {
    return this.repo.findByPatient(patientId);
  }

  getHighEvents(patientId?: string): Promise<HighEventResponseDto[]> {
    return this.repo.findHighEvents(patientId);
  }

  async addReading(dto: CreateReadingDto): Promise<ReadingResponseDto> {
    const reading = await this.repo.create(dto);
    await this.redis.publish('heart-rate:new', dto.patientId);
    return reading;
  }
}
