import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientsRepository } from './patients.repository';
import { RequestTrackingMiddleware } from '../common/middleware/request-tracking.middleware';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService, PatientsRepository],
})
export class PatientsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestTrackingMiddleware)
      .forRoutes({ path: 'patients/:id', method: RequestMethod.GET });
  }
}
