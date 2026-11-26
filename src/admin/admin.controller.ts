import { Controller, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Admin & Consents')
@Controller()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('admin/metrics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMetrics(@Req() req: any) {
    return this.adminService.getMetrics(req.user);
  }

  @Get('patients/:patientId/consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getConsents(@Param('patientId') patientId: string) {
    return this.adminService.getConsents(patientId);
  }

  @Patch('patients/:patientId/consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateConsent(
    @Param('patientId') patientId: string,
    @Body('facilityId') facilityId: string,
    @Body('granted') granted: boolean,
  ) {
    return this.adminService.updateConsent(patientId, facilityId, granted);
  }
}
