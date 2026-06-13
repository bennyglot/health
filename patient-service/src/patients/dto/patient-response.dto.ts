import { ApiProperty } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() age: number;
  @ApiProperty() gender: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty({ description: 'Times this patient data was requested' })
  requestCount: number;
}
