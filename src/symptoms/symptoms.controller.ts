import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SymptomsService } from './symptoms.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Symptoms')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SymptomsController {
  constructor(private symptomsService: SymptomsService) {}

  @Get('patients/:patientId/symptoms')
  getSymptomLogs(@Param('patientId') patientId: string) {
    return this.symptomsService.getSymptomLogs(patientId);
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
