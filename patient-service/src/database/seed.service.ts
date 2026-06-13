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
      const count = await this.prisma.patient.count();
      if (count > 0) return;
    } catch {
      this.logger.warn('Patient table not ready, skipping seed');
      return;
    }

    const dataPath = path.join(process.cwd(), '..', 'patients.json');
    if (!fs.existsSync(dataPath)) {
      this.logger.warn('patients.json not found, skipping seed');
      return;
    }

    const raw = fs.readFileSync(dataPath, 'utf-8');
    const { patients } = JSON.parse(raw) as { patients: Array<{ id: string; name: string; age: number; gender: string }> };

    const result = await this.prisma.patient.createMany({
      data: patients.map(({ id, name, age, gender }) => ({ id, name, age, gender })),
      skipDuplicates: true,
    });
    this.logger.log(`Seeded ${result.count} patients`);
  }
}
