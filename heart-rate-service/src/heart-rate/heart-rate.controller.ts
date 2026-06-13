import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HeartRateService } from './heart-rate.service';
import { CreateReadingDto } from './dto/create-reading.dto';
import { ReadingResponseDto } from './dto/reading-response.dto';
import { HighEventResponseDto } from './dto/high-event-response.dto';

@ApiTags('heart-rate')
@Controller('heart-rate')
export class HeartRateController {
  constructor(private service: HeartRateService) {}

  @Get('high-events')
  @ApiOperation({ summary: 'Get all high heart rate events (>100 bpm) across all patients' })
  @ApiResponse({ status: 200, type: [HighEventResponseDto] })
  getAllHighEvents(): Promise<HighEventResponseDto[]> {
    return this.service.getHighEvents();
  }

  @Get('high-events/:patientId')
  @ApiOperation({ summary: 'Get high heart rate events for a specific patient' })
  @ApiResponse({ status: 200, type: [HighEventResponseDto] })
  getPatientHighEvents(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<HighEventResponseDto[]> {
    return this.service.getHighEvents(patientId);
  }

  @Get(':patientId')
  @ApiOperation({ summary: 'Get all heart rate readings for a patient' })
  @ApiResponse({ status: 200, type: [ReadingResponseDto] })
  getByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<ReadingResponseDto[]> {
    return this.service.getByPatient(patientId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a heart rate reading' })
  @ApiResponse({ status: 201, type: ReadingResponseDto })
  addReading(@Body() dto: CreateReadingDto): Promise<ReadingResponseDto> {
    return this.service.addReading(dto);
  }
}
