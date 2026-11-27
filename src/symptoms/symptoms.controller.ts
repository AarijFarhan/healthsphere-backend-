import { Controller, Get, Post, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SymptomsService } from './symptoms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/pagination/pagination.dto';

@ApiTags('Symptoms')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SymptomsController {
  constructor(private symptomsService: SymptomsService) {}

  @Get('patients/:patientId/symptoms')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSymptomLogs(@Param('patientId') patientId: string, @Query() pagination: PaginationDto) {
    return this.symptomsService.getSymptomLogs(patientId, pagination);
  }

  @Post('patients/:patientId/symptoms')
  logSymptoms(@Param('patientId') patientId: string, @Body() data: any) {
    return this.symptomsService.logSymptoms(patientId, data);
  }

  @Get('patients/:patientId/symptoms/analysis')
  analyzePatterns(@Param('patientId') patientId: string) {
    return this.symptomsService.analyzeSymtomPatterns(patientId);
  }
}
