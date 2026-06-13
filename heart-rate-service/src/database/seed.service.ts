import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    try {
      const count = await this.prisma.heartRateReading.count();
      if (count > 0) return;
    } catch {
      this.logger.warn('HeartRateReading table not ready, skipping seed');
      return;
    }

    const dataPath = path.join(process.cwd(), '..', 'patients.json');
    if (!fs.existsSync(dataPath)) {
      this.logger.warn('patients.json not found, skipping seed');
      return;
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const { heartRateReadings } = JSON.parse(raw) as {
      heartRateReadings: Array<{ patientId: string; timestamp: string; heartRate: number }>;
    };

    const result = await this.prisma.heartRateReading.createMany({
      data: heartRateReadings.map(({ patientId, heartRate, timestamp }) => ({
        patientId,
        heartRate,
        timestamp: new Date(timestamp),
      })),
      skipDuplicates: true,
    });
    this.logger.log(`Seeded ${result.count} heart rate readings`);
  }
}
