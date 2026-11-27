import { Controller, Get, Post, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/pagination/pagination.dto';

@ApiTags('AI Insights')
@Controller('patients')
export class InsightsController {
  constructor(private insightsService: InsightsService) {}

  @Get(':patientId/insights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getInsights(@Param('patientId') patientId: string, @Query() pagination: PaginationDto) {
    return this.insightsService.getInsights(patientId, pagination);
  }

  @Post(':patientId/insights/generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  generateInsights(@Param('patientId') patientId: string) {
    return this.insightsService.generateInsights(patientId);
  }
}
