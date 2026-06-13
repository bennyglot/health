import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsIn } from 'class-validator';

export class CreatePatientDto {
  @ApiProperty({ example: 'Alice Johnson' })
  @IsString()
  name: string;

  @ApiProperty({ example: 34 })
  @IsInt()
  @Min(0)
  age: number;

  @ApiProperty({ example: 'female', enum: ['male', 'female', 'other'] })
  @IsString()
  @IsIn(['male', 'female', 'other'])
  gender: string;
}
