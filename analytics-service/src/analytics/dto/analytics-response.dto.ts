import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsResponseDto {
  @ApiProperty() patientId: string;
  @ApiProperty() avg: number;
  @ApiProperty() max: number;
  @ApiProperty() min: number;
  @ApiProperty() readingCount: number;
  @ApiPropertyOptional() startDate?: string;
  @ApiPropertyOptional() endDate?: string;
}
