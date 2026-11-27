import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FacilitiesService } from './facilities.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { CreateFacilityDto, SetFacilityStatusDto, UpdateFacilityDto } from './dto/facility.dto';

@ApiTags('Facilities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('facilities')
export class FacilitiesController {
  constructor(private facilitiesService: FacilitiesService) {}

  @Get()
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'type'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  findAll(@Query() query: PaginationDto, @Query('search') search?: string, @Query('type') type?: string, @Query('includeInactive') includeInactive?: string) {
    return this.facilitiesService.findAll({ ...query, search, type, includeInactive: includeInactive === 'true' });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.facilitiesService.findOne(id); }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateFacilityDto) { return this.facilitiesService.create(dto); }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateFacilityDto) { return this.facilitiesService.update(id, dto); }

  @Patch(':id/status')
  @Roles('admin')
  setStatus(@Param('id') id: string, @Body() dto: SetFacilityStatusDto) { return this.facilitiesService.setActive(id, dto.isActive); }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) { return this.facilitiesService.remove(id); }
}
