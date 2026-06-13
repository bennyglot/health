import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { AnalyticsResponseDto } from './dto/analytics-response.dto';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get(':patientId')
  @ApiOperation({ summary: 'Get avg/max/min heart rate for a patient within optional time range' })
  @ApiResponse({ status: 200, type: AnalyticsResponseDto })
  @ApiResponse({ status: 404, description: 'No readings found for patient' })
  getAnalytics(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    return this.service.getAnalytics(patientId, query.startDate, query.endDate);
  }
}
