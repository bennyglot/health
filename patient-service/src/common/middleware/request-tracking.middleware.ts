import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class RequestTrackingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestTrackingMiddleware.name);

  constructor(private redis: RedisService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const id = req.params['id'];
    if (id) {
      this.redis.incr(`patient:requests:${id}`).catch((err) =>
        this.logger.error(`Request tracking failed: ${err}`),
      );
    }
    next();
  }
}
