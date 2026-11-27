import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { paginated } from '../common/pagination/pagination';
import { CreateFacilityDto, UpdateFacilityDto } from './dto/facility.dto';

@Injectable()
export class FacilitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateFacilityDto) {
    return this.prisma.facility.create({ data: dto });
  }

  async findAll(query: PaginationDto & { search?: string; type?: string; includeInactive?: boolean }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const where: any = { ...(query.includeInactive ? {} : { isActive: true }) };
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };
    if (query.type) where.type = query.type;
    const orderBy: any = ['name', 'type'].includes(query.sortBy || '')
      ? { [query.sortBy as string]: query.sortOrder || 'asc' } : { name: 'asc' };
    const [items, total] = await Promise.all([
      this.prisma.facility.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      this.prisma.facility.count({ where }),
    ]);
    return paginated(items, total, page, limit);
  }

  async findOne(id: string) {
    const facility = await this.prisma.facility.findUnique({ where: { id } });
    if (!facility) throw new NotFoundException('Facility not found');
    return facility;
  }

  async update(id: string, dto: UpdateFacilityDto) {
    await this.findOne(id);
    return this.prisma.facility.update({ where: { id }, data: dto });
  }

  async setActive(id: string, isActive: boolean) {
    await this.findOne(id);
    return this.prisma.facility.update({ where: { id }, data: { isActive } });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.setActive(id, false);
  }
}
