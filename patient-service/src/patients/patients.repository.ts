import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Patient } from '@prisma/client';

@Injectable()
export class PatientsRepository {
  constructor(private prisma: PrismaService) {}

  findAll(): Promise<Patient[]> {
    return this.prisma.patient.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findById(id: string): Promise<Patient | null> {
    return this.prisma.patient.findUnique({ where: { id } });
  }

  create(dto: CreatePatientDto): Promise<Patient> {
    return this.prisma.patient.create({ data: dto });
  }

  count(): Promise<number> {
    return this.prisma.patient.count();
  }

  createMany(patients: CreatePatientDto[]): Promise<{ count: number }> {
    return this.prisma.patient.createMany({ data: patients, skipDuplicates: true });
  }
}
