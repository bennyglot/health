import { ApiProperty } from '@nestjs/swagger';

export class HighEventResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() patientId: string;
  @ApiProperty() heartRate: number;
  @ApiProperty() timestamp: Date;
}
