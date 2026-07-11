import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Reports')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('patients/:patientId/reports')
  generateReport(
    @Param('patientId') patientId: string,
    @Query('type') type: string,
  ) {
    return this.reportsService.generateReport(patientId, type || 'comprehensive');
  }

  @Get('patients/:patientId/reports')
  getReports(@Param('patientId') patientId: string) {
    return this.reportsService.getReports(patientId);
  }

  @Get('reports/:id')
  getReport(@Param('id') id: string) {
    return this.reportsService.getReport(id);
  }
}
