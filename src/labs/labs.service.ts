import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/pagination/pagination.dto';
import { paginated } from '../common/pagination/pagination';

@Injectable()
export class LabsService {
  constructor(private prisma: PrismaService) {}

  async getLabResults(patientId: string, startDate?: string, endDate?: string, pagination?: PaginationDto) {
    const where: any = { patientId };
    if (startDate || endDate) {
      where.testDate = {};
      if (startDate) where.testDate.gte = new Date(startDate);
      if (endDate) where.testDate.lte = new Date(endDate);
    }
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const [items, total] = await Promise.all([this.prisma.labResult.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: { facility: { select: { name: true, type: true } } },
      orderBy: { testDate: 'desc' },
    }), this.prisma.labResult.count({ where })]);
    return paginated(items, total, page, limit);
  }

  async getLabResultById(id: string) {
    const result = await this.prisma.labResult.findUnique({ where: { id } });
    if (!result) throw new NotFoundException('Lab result not found');
    return result;
  }
}
