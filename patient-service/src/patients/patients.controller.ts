import { Controller, Get, Post, Body, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';

@ApiTags('patients')
@Controller('patients')
export class PatientsController {
  constructor(private service: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'List all patients with request counts' })
  @ApiResponse({ status: 200, type: [PatientResponseDto] })
  findAll(): Promise<PatientResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single patient by ID' })
  @ApiResponse({ status: 200, type: PatientResponseDto })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PatientResponseDto> {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new patient' })
  @ApiResponse({ status: 201, type: PatientResponseDto })
  create(@Body() dto: CreatePatientDto): Promise<PatientResponseDto> {
    return this.service.create(dto);
  }
}
