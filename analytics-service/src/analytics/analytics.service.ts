import { Injectable } from '@nestjs/common';
import { AnalyticsRepository } from './analytics.repository';
import { RedisService } from '../redis/redis.service';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';

const CACHE_TTL = 300;

@Injectable()
export class AnalyticsService {
  constructor(
    private repo: AnalyticsRepository,
    private redis: RedisService,
  ) {}

  async getAnalytics(
    patientId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AnalyticsResponseDto> {
    const cacheKey = `analytics:${patientId}:${startDate ?? 'all'}:${endDate ?? 'all'}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as AnalyticsResponseDto;

    const result = await this.repo.aggregate(
      patientId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    const response: AnalyticsResponseDto = {
      patientId,
      avg: result.avg,
      max: result.max,
      min: result.min,
      readingCount: result.count,
      startDate,
      endDate,
    };

    await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
    return response;
  }
}
