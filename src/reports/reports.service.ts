import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../gemini/gemini.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { paginated } from '../common/pagination/pagination';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
  ) {}

  async generateReport(patientId: string, type: string = 'comprehensive') {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        medicalRecords: { take: 20, orderBy: { recordDate: 'desc' } },
        labResults: { take: 30, orderBy: { testDate: 'desc' } },
        aiInsights: { take: 10, orderBy: { generatedAt: 'desc' } },
        riskAssessments: { take: 5, orderBy: { assessedAt: 'desc' } },
      },
    });

    if (!patient) throw new Error('Patient not found');

    const summary = await this.gemini.generateResponse(
      `Generate a ${type} health report for patient ${patient.fullName}. 
      Conditions: ${patient.chronicConditions.join(', ')}
      Recent labs: ${JSON.stringify(patient.labResults.slice(0, 5))}
      Insights: ${patient.aiInsights.map((i) => i.insightText).join('; ')}
      Generate a concise, clear summary with key findings and recommendations.`,
    );

    const detailedContent = this.buildReportContent(patient, type, summary);

    const report = await this.prisma.healthReport.create({
      data: {
        patientId,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Health Report`,
        summary,
        detailedContent,
        reportType: type,
        generatedBy: 'ai',
      },
    });

    return report;
  }

  private buildReportContent(patient: any, type: string, summary: string): string {
    const sections = [
      `# ${type.charAt(0).toUpperCase() + type.slice(1)} Health Report`,
      `**Patient**: ${patient.fullName}`,
      `**Generated**: ${new Date().toLocaleString()}`,
      '',
      '## AI Summary',
      summary,
      '',
      '## Key Metrics',
      ...patient.labResults.slice(0, 5).map((l: any) =>
        `- **${l.testName}**: ${l.value} ${l.unit} (ref: ${l.referenceRange}) ${l.isAbnormal ? '⚠️' : '✅'}`,
      ),
      '',
      '## Chronic Conditions',
      ...patient.chronicConditions.map((c: string) => `- ${c}`),
      '',
      '## Recent Insights',
      ...patient.aiInsights.slice(0, 3).map((i: any) => `- ${i.insightText}`),
    ];
    return sections.join('\n');
  }

  async getReports(patientId: string, pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const [items, total] = await Promise.all([this.prisma.healthReport.findMany({
      where: { patientId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { generatedAt: 'desc' },
    }), this.prisma.healthReport.count({ where: { patientId } })]);
    return paginated(items, total, page, limit);
  }

  async getReport(id: string) {
    return this.prisma.healthReport.findUnique({ where: { id } });
  }
}
