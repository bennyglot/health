import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { PatientsModule } from './patients/patients.module';
import { SeedService } from './database/seed.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    PatientsModule,
  ],
  controllers: [HealthController],
  providers: [SeedService],
})
export class AppModule {}
