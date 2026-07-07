import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination/paginate.util';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, pageSize = 10, search } = query;

    const where = search
      ? {
          OR: [
            { key: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return paginate(
      () => this.prisma.permission.count({ where }),
      (skip, take) =>
        this.prisma.permission.findMany({
          where,
          skip,
          take,
          orderBy: { key: 'asc' },
        }),
      page,
      pageSize,
    );
  }
}
