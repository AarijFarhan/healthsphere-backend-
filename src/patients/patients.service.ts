import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePatientDto } from './dto/patient.dto';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { paginated } from '../common/pagination/pagination';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async listPatients(pagination?: PaginationDto, search?: string) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const where: any = search
      ? { fullName: { contains: search, mode: 'insensitive' } }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { medicalRecords: true, appointments: true } } },
      }),
      this.prisma.patient.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async getPatient(id: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: { user: { select: { email: true, role: true } } },
    });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  async getPatientByUserId(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: { user: { select: { email: true, role: true } } },
    });
    if (!patient) throw new NotFoundException('Patient profile not found');
    return patient;
  }

  async updatePatient(id: string, dto: UpdatePatientDto) {
    await this.getPatient(id);
    return this.prisma.patient.update({ where: { id }, data: dto });
  }

  async getTimeline(id: string, pagination?: PaginationDto) {
    await this.getPatient(id);
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const where = { patientId: id };
    const [records, total] = await Promise.all([this.prisma.medicalRecord.findMany({
      where: { patientId: id },
      skip: (page - 1) * limit,
      take: limit,
      include: { facility: { select: { name: true, type: true } } },
      orderBy: { recordDate: 'desc' },
    }), this.prisma.medicalRecord.count({ where })]);
    const items = records.map((r) => ({
      id: r.id,
      date: r.recordDate,
      type: r.recordType,
      title: r.title,
      content: r.content,
      facility: r.facility,
      clinician: r.clinician,
      sourceFormat: r.sourceFormat,
    }));
    return paginated(items, total, page, limit);
  }
}
