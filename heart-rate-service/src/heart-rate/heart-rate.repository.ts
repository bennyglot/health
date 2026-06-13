import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HeartRateReading } from '@prisma/client';
import { CreateReadingDto } from './dto/create-reading.dto';

const HIGH_HEART_RATE_THRESHOLD = 100;

@Injectable()
export class HeartRateRepository {
  constructor(private prisma: PrismaService) {}

  findByPatient(patientId: string): Promise<HeartRateReading[]> {
    return this.prisma.heartRateReading.findMany({
      where: { patientId },
      orderBy: { timestamp: 'asc' },
    });
  }

  findHighEvents(patientId?: string): Promise<HeartRateReading[]> {
    return this.prisma.heartRateReading.findMany({
      where: {
        heartRate: { gt: HIGH_HEART_RATE_THRESHOLD },
        ...(patientId ? { patientId } : {}),
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  create(dto: CreateReadingDto): Promise<HeartRateReading> {
    return this.prisma.heartRateReading.create({
      data: {
        patientId: dto.patientId,
        heartRate: dto.heartRate,
        timestamp: new Date(dto.timestamp),
      },
    });
  }

  count(): Promise<number> {
    return this.prisma.heartRateReading.count();
  }

  createMany(readings: Array<{ patientId: string; heartRate: number; timestamp: Date }>): Promise<{ count: number }> {
    return this.prisma.heartRateReading.createMany({ data: readings, skipDuplicates: true });
  }
}
