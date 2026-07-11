import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HuggingFaceService } from './huggingface.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('AI Models')
@Controller('ml')
export class HuggingFaceController {
  constructor(
    private hfService: HuggingFaceService,
    private prisma: PrismaService,
  ) {}

  @Post('predict-risk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async predictRisk(@Body() body: { symptoms: string[]; patientId: string }) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: body.patientId },
    });
    const result = await this.hfService.predictDiseaseRisk(body.symptoms, {
      chronicConditions: patient?.chronicConditions || [],
      allergies: patient?.allergies || [],
      age: patient?.dob ? Math.floor((Date.now() - new Date(patient.dob).getTime()) / 31557600000) : null,
      gender: patient?.gender,
    });

    // Save assessment
    if (result.predictions.length > 0) {
      await this.prisma.riskAssessment.createMany({
        data: result.predictions.map((p) => ({
          patientId: body.patientId,
          condition: p.condition,
          riskScore: p.probability,
          riskLevel: p.probability > 0.5 ? 'high' : p.probability > 0.3 ? 'moderate' : 'low',
          factors: body.symptoms,
          recommendation: 'Based on AI risk assessment. Consult your physician.',
          modelUsed: 'biomedical-bert-hf',
        })),
      });
    }

    return result;
  }

  @Post('analyze-text')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async analyzeText(@Body() body: { text: string }) {
    return this.hfService.analyzeMedicalText(body.text);
  }

  @Post('medication-safety')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async checkMedicationSafety(@Body() body: { medications: string[] }) {
    return this.hfService.assessMedicationSafety(body.medications);
  }

  @Get('risk-assessments/:patientId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRiskAssessments(@Param('patientId') patientId: string) {
    return this.prisma.riskAssessment.findMany({
      where: { patientId },
      orderBy: { assessedAt: 'desc' },
    });
  }
}
