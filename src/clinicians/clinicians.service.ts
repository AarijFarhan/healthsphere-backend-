import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { paginated } from '../common/pagination/pagination';

@Injectable()
export class CliniciansService {
  constructor(private prisma: PrismaService) {}

  async getPatients(clinicianId: string, search?: string, sort?: string, filter?: string, pagination?: PaginationDto) {
    const clinician = await this.prisma.clinician.findUnique({ where: { id: clinicianId } });
    if (!clinician) throw new NotFoundException('Clinician not found');

    const where: any = {};
    if (search) {
      where.fullName = { contains: search, mode: 'insensitive' };
    }
    if (filter) {
      where.chronicConditions = { has: filter };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'name') orderBy = { fullName: 'asc' };
    if (sort === 'recent') orderBy = { createdAt: 'desc' };

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const [patients, total] = await Promise.all([this.prisma.patient.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: { select: { medicalRecords: true, appointments: true } },
      },
    }), this.prisma.patient.count({ where })]);

    return paginated(patients, total, page, limit);
  }

  async getClinicianByUserId(userId: string) {
    const clinician = await this.prisma.clinician.findUnique({
      where: { userId },
    });
    if (!clinician) throw new NotFoundException('Clinician profile not found');
    return clinician;
  }

  async addNote(patientId: string, clinicianUserId: string, noteText: string) {
    const clinician = await this.prisma.clinician.findUnique({
      where: { userId: clinicianUserId },
    });
    if (!clinician) throw new NotFoundException('Clinician not found');

    return this.prisma.clinicianNote.create({
      data: {
        patientId,
        clinicianId: clinician.id,
        noteText,
      },
    });
  }

  async getNotes(patientId: string, pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const where = { patientId };
    const [items, total] = await Promise.all([this.prisma.clinicianNote.findMany({
      where: { patientId },
      skip: (page - 1) * limit,
      take: limit,
      include: { clinician: { select: { fullName: true, specialty: true } } },
      orderBy: { createdAt: 'desc' },
    }), this.prisma.clinicianNote.count({ where })]);
    return paginated(items, total, page, limit);
  }

  private async resolveClinicianId(id: string): Promise<string> {
    if (process.env.DEMO_MODE !== 'true' || id !== 'clinician-1-id') return id;
    const user = await this.prisma.user.findUnique({ where: { email: 'clinician@demo.com' } });
    if (!user) return id;
    const clinician = await this.prisma.clinician.findUnique({ where: { userId: user.id } });
    return clinician?.id || id;
  }

  private async getScopePatientIds(clinicianId: string): Promise<string[]> {
    const [appointments, notes, reports] = await Promise.all([
      this.prisma.appointment.findMany({ where: { clinicianId }, select: { patientId: true } }),
      this.prisma.clinicianNote.findMany({ where: { clinicianId }, select: { patientId: true } }),
      this.prisma.healthReport.findMany({ where: { clinicianId }, select: { patientId: true } }),
    ]);
    return [...new Set([...appointments, ...notes, ...reports].map((item) => item.patientId))];
  }

  private diffDays(later: Date, earlier: Date): number {
    return Math.max(0, (later.getTime() - earlier.getTime()) / 86400000);
  }

  private formatTrend(current: number, previous: number): string {
    if (!previous) return current ? '↑ 100%' : '→ 0%';
    const change = Math.round(Math.abs(((current - previous) / previous) * 100));
    if (!change) return '→ 0%';
    return `${current > previous ? '↑' : '↓'} ${change}%`;
  }

  private duplicateTestRate(labs: Array<{ patientId: string; testName: string; testDate: Date }>): number {
    const recent = new Map<string, number>();
    let duplicates = 0;
    const sorted = [...labs].sort((a, b) => a.testDate.getTime() - b.testDate.getTime());
    for (const lab of sorted) {
      const key = `${lab.patientId}:${lab.testName.toLowerCase()}`;
      const last = recent.get(key);
      if (last !== undefined && lab.testDate.getTime() - last <= 30 * 86400000) {
        duplicates += 1;
      }
      recent.set(key, lab.testDate.getTime());
    }
    return labs.length ? Number(((duplicates / labs.length) * 100).toFixed(1)) : 0;
  }

  async getAnalytics(clinicianId: string) {
    const resolvedId = await this.resolveClinicianId(clinicianId);
    const clinician = await this.prisma.clinician.findUnique({ where: { id: resolvedId } });
    if (!clinician) throw new NotFoundException('Clinician not found');

    const patientIds = await this.getScopePatientIds(resolvedId);
    if (!patientIds.length) {
      return {
        patientCount: 0,
        monthly: [],
        kpis: {
          avgTimeToDx: { value: '0.0', unit: 'days', trend: '→ 0%' },
          redundantTestsReduced: { value: '0', unit: '%', trend: '→ 0%' },
          monthlyPatientVolume: { value: '0', trend: '→ 0%' },
          aiAssistedDiagnoses: { value: '0', trend: '→ 0%' },
        },
      };
    }

    const [appointments, insights, labs] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { clinicianId: resolvedId },
        select: { patientId: true, scheduledAt: true, createdAt: true },
      }),
      this.prisma.aIInsight.findMany({
        where: { patientId: { in: patientIds } },
        select: { patientId: true, generatedAt: true, category: true },
      }),
      this.prisma.labResult.findMany({
        where: { patientId: { in: patientIds } },
        select: { patientId: true, testName: true, testDate: true },
      }),
    ]);

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
      return {
        year: date.getUTCFullYear(),
        monthIndex: date.getUTCMonth(),
        label: date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
      };
    });

    const monthly = months.map(({ year, monthIndex, label }) => {
      const start = new Date(Date.UTC(year, monthIndex, 1));
      const end = new Date(Date.UTC(year, monthIndex + 1, 1));
      const inRange = (date: Date) => date >= start && date < end;

      const patients = new Set(
        appointments.filter((item) => inRange(item.scheduledAt)).map((item) => item.patientId),
      ).size;

      const monthInsights = insights.filter((item) => inRange(item.generatedAt));
      const durations = monthInsights
        .map((insight) => {
          const firstAppointment = appointments
            .filter((item) => item.patientId === insight.patientId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
          return firstAppointment
            ? this.diffDays(insight.generatedAt, firstAppointment.createdAt)
            : null;
        })
        .filter((value): value is number => value !== null);

      const avgTimeToDx = durations.length
        ? Number((durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(1))
        : 0;

      return { month: label, patients, diagnoses: monthInsights.length, avgTimeToDx };
    });

    const current = monthly[monthly.length - 1];
    const previous = monthly[monthly.length - 2];
    const redundantTestsReduced = this.duplicateTestRate(labs);

    return {
      patientCount: patientIds.length,
      monthly,
      kpis: {
        avgTimeToDx: {
          value: current.avgTimeToDx.toFixed(1),
          unit: 'days',
          trend: this.formatTrend(current.avgTimeToDx, previous.avgTimeToDx),
        },
        redundantTestsReduced: {
          value: String(redundantTestsReduced),
          unit: '%',
          trend: '→ 0%',
        },
        monthlyPatientVolume: {
          value: String(current.patients),
          trend: this.formatTrend(current.patients, previous.patients),
        },
        aiAssistedDiagnoses: {
          value: String(current.diagnoses),
          trend: this.formatTrend(current.diagnoses, previous.diagnoses),
        },
      },
      summary: {
        avgTimeToDx: current.avgTimeToDx,
        redundantTestsReduced,
        monthlyPatientVolume: current.patients,
        aiAssistedDiagnoses: current.diagnoses,
      },
    };
  }

  async getAnalyticsMonthly(clinicianId: string) {
    const analytics = await this.getAnalytics(clinicianId);
    return analytics.monthly;
  }

  async getAnalyticsKpis(clinicianId: string) {
    const analytics = await this.getAnalytics(clinicianId);
    return analytics.kpis;
  }
}
