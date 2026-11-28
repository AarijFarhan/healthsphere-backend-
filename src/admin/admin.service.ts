import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { paginated } from '../common/pagination/pagination';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(user?: { id: string; role: string }) {
    if (user && !['admin', 'clinician', 'demo'].includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    let clinicianId: string | undefined;
    let patientIds: string[] | undefined;

    if (user?.role === 'clinician') {
      const clinician = await this.prisma.clinician.findUnique({ where: { userId: user.id } });
      if (clinician) {
        clinicianId = clinician.id;
        const appointments = await this.prisma.appointment.findMany({
          where: { clinicianId: clinician.id },
          select: { patientId: true },
        });
        patientIds = [...new Set(appointments.map((item) => item.patientId))];
      }
    }

    const patientScope = patientIds ? { patientId: { in: patientIds } } : {};

    const [totalRecords, totalDocuments, totalInsights, totalAppointments, totalClinicians, ocrCompleted] =
      await Promise.all([
        this.prisma.medicalRecord.count({ where: patientScope }),
        this.prisma.uploadedDocument.count({ where: patientScope }),
        this.prisma.aIInsight.count({ where: patientScope }),
        clinicianId
          ? this.prisma.appointment.count({ where: { clinicianId } })
          : this.prisma.appointment.count(),
        this.prisma.clinician.count(),
        this.prisma.uploadedDocument.count({ where: { ...patientScope, ocrStatus: 'complete' } }),
      ]);

    const appointmentsByStatus = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: clinicianId ? { clinicianId } : {},
      _count: true,
    });

    const recordsByType = await this.prisma.medicalRecord.groupBy({
      by: ['recordType'],
      where: patientScope,
      _count: true,
    });

    const totalPatients = patientIds ? patientIds.length : await this.prisma.patient.count();

    const [totalUsers, totalFacilities, totalLabs, totalChatSessions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.facility.count(),
      this.prisma.labResult.count({ where: patientScope }),
      this.prisma.aIChatSession.count(),
    ]);

    const monthStarts = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      date.setMonth(date.getMonth() - (5 - index));
      return date;
    });

    const [monthlyPatients, monthlyRecords, monthlyInsights] = await Promise.all([
      this.prisma.patient.findMany({
        where: {
          createdAt: { gte: monthStarts[0] },
          ...(patientIds ? { id: { in: patientIds } } : {}),
        },
        select: { createdAt: true },
      }),
      this.prisma.medicalRecord.findMany({
        where: { recordDate: { gte: monthStarts[0] }, ...patientScope },
        select: { recordDate: true },
      }),
      this.prisma.aIInsight.findMany({
        where: { generatedAt: { gte: monthStarts[0] }, ...patientScope },
        select: { generatedAt: true },
      }),
    ]);

    const monthKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const monthly = monthStarts.map((start) => {
      const key = monthKey(start);
      const countInMonth = (dates: Date[]) =>
        dates.filter((date) => monthKey(new Date(date)) === key).length;
      return {
        month: start.toLocaleString('en', { month: 'short' }),
        patients: countInMonth(monthlyPatients.map((item) => new Date(item.createdAt))),
        records: countInMonth(monthlyRecords.map((item) => new Date(item.recordDate))),
        insights: countInMonth(monthlyInsights.map((item) => new Date(item.generatedAt))),
      };
    });

    const [recentRecords, recentAppointments, recentInsights, recentDocuments] = await Promise.all([
      this.prisma.medicalRecord.findMany({
        where: patientScope,
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, title: true, createdAt: true, patient: { select: { fullName: true } } },
      }),
      this.prisma.appointment.findMany({
        where: clinicianId ? { clinicianId } : {},
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, reason: true, createdAt: true, patient: { select: { fullName: true } } },
      }),
      this.prisma.aIInsight.findMany({
        where: patientScope,
        orderBy: { generatedAt: 'desc' },
        take: 2,
        select: { id: true, insightText: true, generatedAt: true, patient: { select: { fullName: true } } },
      }),
      this.prisma.uploadedDocument.findMany({
        where: patientScope,
        orderBy: { uploadDate: 'desc' },
        take: 2,
        select: { id: true, fileName: true, uploadDate: true, patient: { select: { fullName: true } } },
      }),
    ]);

    const recentActivity = [
      ...recentRecords.map((item) => ({
        id: item.id,
        type: 'record',
        title: item.title,
        subject: item.patient.fullName,
        at: item.createdAt.toISOString(),
      })),
      ...recentAppointments.map((item) => ({
        id: item.id,
        type: 'appointment',
        title: item.reason || 'Appointment',
        subject: item.patient.fullName,
        at: item.createdAt.toISOString(),
      })),
      ...recentInsights.map((item) => ({
        id: item.id,
        type: 'insight',
        title: item.insightText.slice(0, 90),
        subject: item.patient.fullName,
        at: item.generatedAt.toISOString(),
      })),
      ...recentDocuments.map((item) => ({
        id: item.id,
        type: 'document',
        title: item.fileName,
        subject: item.patient.fullName,
        at: item.uploadDate.toISOString(),
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    return {
      totalPatients,
      totalRecords,
      totalDocuments,
      totalInsights,
      totalAppointments,
      totalClinicians,
      totalUsers,
      totalFacilities,
      totalLabs,
      totalChatSessions,
      ocrCompleted,
      digitizationRate: totalDocuments > 0 ? ((ocrCompleted / totalDocuments) * 100).toFixed(1) : '0',
      appointmentsByStatus,
      recordsByType,
      monthly,
      recentActivity,
      scope: clinicianId ? 'clinician' : 'global',
    };
  }

  async getResource(resource: string, pagination?: PaginationDto, search?: string) {
    const configs: Record<string, { model: any; orderBy: any; fields: string[]; select?: any; include?: any }> = {
      users: {
        model: this.prisma.user,
        orderBy: { createdAt: 'desc' },
        fields: ['email'],
        select: { id: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true },
      },
      patients: {
        model: this.prisma.patient,
        orderBy: { createdAt: 'desc' },
        fields: ['fullName', 'phone', 'city', 'bloodType'],
      },
      clinicians: {
        model: this.prisma.clinician,
        orderBy: { createdAt: 'desc' },
        fields: ['fullName', 'specialty', 'facilityName', 'licenseNo'],
      },
      facilities: {
        model: this.prisma.facility,
        orderBy: { name: 'asc' },
        fields: ['name', 'address', 'email'],
      },
      'medical-records': {
        model: this.prisma.medicalRecord,
        orderBy: { createdAt: 'desc' },
        fields: ['title', 'content', 'clinician', 'patient.fullName', 'facility.name'],
        include: { patient: { select: { fullName: true } }, facility: { select: { name: true } } },
      },
      'lab-results': {
        model: this.prisma.labResult,
        orderBy: { testDate: 'desc' },
        fields: ['testName', 'category', 'referenceRange', 'patient.fullName', 'facility.name'],
        include: { patient: { select: { fullName: true } }, facility: { select: { name: true } } },
      },
      documents: {
        model: this.prisma.uploadedDocument,
        orderBy: { uploadDate: 'desc' },
        fields: ['fileName', 'documentType', 'patient.fullName'],
        include: { patient: { select: { fullName: true } } },
      },
      insights: {
        model: this.prisma.aIInsight,
        orderBy: { generatedAt: 'desc' },
        fields: ['insightText', 'metric', 'severity', 'category', 'patient.fullName'],
        include: { patient: { select: { fullName: true } } },
      },
      appointments: {
        model: this.prisma.appointment,
        orderBy: { scheduledAt: 'desc' },
        fields: ['reason', 'notes', 'patient.fullName', 'clinician.fullName'],
        include: {
          patient: { select: { fullName: true } },
          clinician: { select: { fullName: true } },
        },
      },
      'chat-sessions': {
        model: this.prisma.aIChatSession,
        orderBy: { updatedAt: 'desc' },
        fields: ['title', 'user.email'],
        include: { user: { select: { email: true } }, _count: { select: { messages: true } } },
      },
    };

    const config = configs[resource];
    if (!config) throw new NotFoundException(`Unknown resource: ${resource}`);

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const term = (search || '').trim();
    const findArgs: any = {
      skip: (page - 1) * limit,
      take: limit,
      orderBy: config.orderBy,
    };

    if (config.select) findArgs.select = config.select;
    else if (config.include) findArgs.include = config.include;

    if (term) {
      findArgs.where = {
        OR: config.fields.map((field) => {
          const [relation, nested] = field.split('.');
          return nested
            ? { [relation]: { [nested]: { contains: term, mode: 'insensitive' } } }
            : { [field]: { contains: term, mode: 'insensitive' } };
        }),
      };
    }

    const [items, total] = await Promise.all([
      config.model.findMany(findArgs),
      config.model.count({ where: findArgs.where || {} }),
    ]);
    return paginated(items, total, page, limit);
  }

  async getConsents(patientId: string, pagination?: PaginationDto) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const where = { patientId };
    const [items, total] = await Promise.all([this.prisma.dataSharingConsent.findMany({
      where: { patientId },
      skip: (page - 1) * limit,
      take: limit,
      include: { facility: { select: { name: true, type: true } } },
    }), this.prisma.dataSharingConsent.count({ where })]);
    return paginated(items, total, page, limit);
  }

  async updateConsent(patientId: string, facilityId: string, granted: boolean) {
    return this.prisma.dataSharingConsent.upsert({
      where: {
        patientId_facilityId: { patientId, facilityId },
      },
      update: { granted },
      create: { patientId, facilityId, granted },
    });
  }
}
