import { ForbiddenException, Injectable } from '@nestjs/common';
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

    return {
      totalPatients,
      totalRecords,
      totalDocuments,
      totalInsights,
      totalAppointments,
      totalClinicians,
      ocrCompleted,
      digitizationRate: totalDocuments > 0 ? ((ocrCompleted / totalDocuments) * 100).toFixed(1) : '0',
      appointmentsByStatus,
      recordsByType,
      scope: clinicianId ? 'clinician' : 'global',
    };
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
