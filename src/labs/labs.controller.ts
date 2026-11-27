import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LabsService } from './labs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PaginationDto } from '../common/pagination/pagination.dto';

@ApiTags('Lab Results')
@Controller()
export class LabsController {
  constructor(private labsService: LabsService) {}

  @Get('patients/:patientId/lab-results')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getLabResults(
    @Param('patientId') patientId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.labsService.getLabResults(patientId, startDate, endDate, pagination);
  }
}
