import { Controller, Get, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/pagination/pagination.dto';

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

  @Get('admin/resources/:resource')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiQuery({ name: 'search', required: false })
  getResource(
    @Param('resource') resource: string,
    @Query('search') search: string | undefined,
    @Query() pagination: PaginationDto,
  ) {
    return this.adminService.getResource(resource, pagination, search);
  }

  @Get('patients/:patientId/consents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getConsents(@Param('patientId') patientId: string, @Query() pagination: PaginationDto) {
    return this.adminService.getConsents(patientId, pagination);
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
