import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HuggingFaceService } from '../huggingface/huggingface.service';

@Injectable()
export class MedicationsService {
  constructor(
    private prisma: PrismaService,
    private hf: HuggingFaceService,
  ) {}

  async getReminders(patientId: string) {
    return this.prisma.medicationReminder.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createReminder(patientId: string, data: {
    medication: string;
    dosage: string;
    frequency: string;
    timeOfDay: string[];
    startDate: string;
    endDate?: string;
    notes?: string;
  }) {
    return this.prisma.medicationReminder.create({
      data: {
        patientId,
        medication: data.medication,
        dosage: data.dosage,
        frequency: data.frequency,
        timeOfDay: data.timeOfDay,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        notes: data.notes,
      },
    });
  }

  async updateReminder(id: string, data: { isActive?: boolean }) {
    return this.prisma.medicationReminder.update({ where: { id }, data });
  }

  async deleteReminder(id: string) {
    return this.prisma.medicationReminder.delete({ where: { id } });
  }

  async checkInteractions(medications: string[]) {
    return this.hf.assessMedicationSafety(medications);
  }

  async getPatientMedications(patientId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    const reminders = await this.getReminders(patientId);
    return {
      listed: patient?.medications || [],
      reminders: reminders.filter((r) => r.isActive),
    };
  }
}
