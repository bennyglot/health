import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsInt, Min, Max, IsDateString } from 'class-validator';

export class CreateReadingDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ example: 85, minimum: 1, maximum: 300 })
  @IsInt()
  @Min(1)
  @Max(300)
  heartRate: number;

  @ApiProperty({ example: '2024-03-01T08:00:00Z' })
  @IsDateString()
  timestamp: string;
}
