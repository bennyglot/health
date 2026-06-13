import { ApiProperty } from '@nestjs/swagger';

export class ReadingResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() patientId: string;
  @ApiProperty() heartRate: number;
  @ApiProperty() timestamp: Date;
}
