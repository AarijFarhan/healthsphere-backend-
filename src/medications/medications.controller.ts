import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MedicationsService } from './medications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Medications')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MedicationsController {
  constructor(private medsService: MedicationsService) {}

  @Get('patients/:patientId/medications')
  getMedications(@Param('patientId') patientId: string) {
    return this.medsService.getPatientMedications(patientId);
  }

  @Get('patients/:patientId/medication-reminders')
  getReminders(@Param('patientId') patientId: string) {
    return this.medsService.getReminders(patientId);
  }

  @Post('patients/:patientId/medication-reminders')
  createReminder(@Param('patientId') patientId: string, @Body() data: any) {
    return this.medsService.createReminder(patientId, data);
  }

  @Patch('medication-reminders/:id')
  updateReminder(@Param('id') id: string, @Body() data: { isActive?: boolean }) {
    return this.medsService.updateReminder(id, data);
  }

  @Delete('medication-reminders/:id')
  deleteReminder(@Param('id') id: string) {
    return this.medsService.deleteReminder(id);
  }

  @Post('medications/check-interactions')
  checkInteractions(@Body() body: { medications: string[] }) {
    return this.medsService.checkInteractions(body.medications);
  }
}
