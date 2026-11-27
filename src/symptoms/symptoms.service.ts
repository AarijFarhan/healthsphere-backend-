import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HuggingFaceService } from '../huggingface/huggingface.service';
import { GeminiService } from '../gemini/gemini.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { paginated } from '../common/pagination/pagination';

@Injectable()
export class SymptomsService {
  constructor(
    private prisma: PrismaService,
    private hf: HuggingFaceService,
    private gemini: GeminiService,
  ) {}

  async logSymptoms(patientId: string, data: {
    symptoms: string[];
    severity: number;
    duration?: string;
    notes?: string;
  }) {
    // Get AI triage
    let aiTriage = '';
    try {
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      const risk = await this.hf.predictDiseaseRisk(data.symptoms, {
        chronicConditions: patient?.chronicConditions || [],
        allergies: patient?.allergies || [],
      });
      aiTriage = risk.predictions.map((p) =>
        `${p.condition}: ${(p.probability * 100).toFixed(0)}% probability`,
      ).join('; ');
    } catch {}

    return this.prisma.symptomLog.create({
      data: {
        patientId,
        symptoms: data.symptoms,
        severity: data.severity,
        duration: data.duration,
        notes: data.notes,
        aiTriage,
      },
    });
  }

  async getSymptomLogs(patientId: string, pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const where = { patientId };
    const [items, total] = await Promise.all([this.prisma.symptomLog.findMany({
      where: { patientId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { loggedAt: 'desc' },
    }), this.prisma.symptomLog.count({ where })]);
    return paginated(items, total, page, limit);
  }

  async analyzeSymtomPatterns(patientId: string) {
    const logs = (await this.getSymptomLogs(patientId)).data;
    const allSymptoms = logs.flatMap((l) => l.symptoms);
    const frequency = allSymptoms.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSymptoms = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const avgSeverity = logs.length > 0
      ? (logs.reduce((sum, l) => sum + l.severity, 0) / logs.length).toFixed(1)
      : '0';

    const analysis = await this.gemini.generateResponse(
      `Analyze these symptom patterns: ${topSymptoms.map(([s, c]) => `${s}: ${c} times`).join(', ')}. Average severity: ${avgSeverity}/10. Provide brief health recommendations.`,
    );

    return {
      totalLogs: logs.length,
      topSymptoms: Object.fromEntries(topSymptoms),
      averageSeverity: parseFloat(avgSeverity),
      aiAnalysis: analysis,
    };
  }
}
