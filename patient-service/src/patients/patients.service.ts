import { Injectable, NotFoundException } from '@nestjs/common';
import { Patient } from '@prisma/client';
import { PatientsRepository } from './patients.repository';
import { RedisService } from '../redis/redis.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientResponseDto } from './dto/patient-response.dto';

@Injectable()
export class PatientsService {
  constructor(
    private repo: PatientsRepository,
    private redis: RedisService,
  ) {}

  async findAll(): Promise<PatientResponseDto[]> {
    const patients = await this.repo.findAll();
    return Promise.all(patients.map((p) => this.attachRequestCount(p)));
  }

  async findById(id: string): Promise<PatientResponseDto> {
    const patient = await this.repo.findById(id);
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return this.attachRequestCount(patient);
  }

  async create(dto: CreatePatientDto): Promise<PatientResponseDto> {
    const patient = await this.repo.create(dto);
    return this.attachRequestCount(patient);
  }

  private async attachRequestCount(patient: Patient): Promise<PatientResponseDto> {
    const val = await this.redis.get(`patient:requests:${patient.id}`);
    return { ...patient, requestCount: val ? parseInt(val, 10) : 0 };
  }
}
