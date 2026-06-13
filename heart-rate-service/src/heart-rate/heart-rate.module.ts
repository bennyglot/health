import { Module } from '@nestjs/common';
import { HeartRateController } from './heart-rate.controller';
import { HeartRateService } from './heart-rate.service';
import { HeartRateRepository } from './heart-rate.repository';

@Module({
  controllers: [HeartRateController],
  providers: [HeartRateService, HeartRateRepository],
})
export class HeartRateModule {}
