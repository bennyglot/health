import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ example: '2024-03-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-03-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
