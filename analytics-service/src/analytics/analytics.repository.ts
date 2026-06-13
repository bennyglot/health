import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsRepository {
  constructor(private prisma: PrismaService) {}

  async aggregate(patientId: string, startDate?: Date, endDate?: Date) {
    const where = {
      patientId,
      ...(startDate || endDate
        ? {
            timestamp: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    };

    const result = await this.prisma.heartRateReading.aggregate({
      where,
      _avg: { heartRate: true },
      _max: { heartRate: true },
      _min: { heartRate: true },
      _count: { heartRate: true },
    });

    if (result._count.heartRate === 0) {
      throw new NotFoundException(`No readings found for patient ${patientId}`);
    }

    return {
      avg: Math.round((result._avg.heartRate ?? 0) * 100) / 100,
      max: result._max.heartRate ?? 0,
      min: result._min.heartRate ?? 0,
      count: result._count.heartRate,
    };
  }
}
