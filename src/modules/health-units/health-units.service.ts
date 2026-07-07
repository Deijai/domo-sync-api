import { Injectable, NotFoundException } from '@nestjs/common';
import { HealthUnit, SimpleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination/paginate.util';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { CreateHealthUnitDto } from './dto/create-health-unit.dto';
import { UpdateHealthUnitDto } from './dto/update-health-unit.dto';

@Injectable()
export class HealthUnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, pageSize = 10, search, status } = query;

    const where = {
      deletedAt: null,
      ...(status ? { status: status as SimpleStatus } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { code: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return paginate(
      () => this.prisma.healthUnit.count({ where }),
      (skip, take) =>
        this.prisma.healthUnit.findMany({
          where,
          skip,
          take,
          orderBy: { name: 'asc' },
        }),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<HealthUnit> {
    const healthUnit = await this.prisma.healthUnit.findFirst({
      where: { id, deletedAt: null },
    });
    if (!healthUnit) {
      throw new NotFoundException('Unidade de saúde não encontrada.');
    }
    return healthUnit;
  }

  async create(dto: CreateHealthUnitDto) {
    if (dto.isDefault) {
      return this.prisma.$transaction(async (tx) => {
        await tx.healthUnit.updateMany({
          where: { isDefault: true },
          data: { isDefault: false },
        });
        return tx.healthUnit.create({ data: dto });
      });
    }
    return this.prisma.healthUnit.create({ data: dto });
  }

  async update(id: string, dto: UpdateHealthUnitDto) {
    await this.findOne(id);
    if (dto.isDefault) {
      return this.prisma.$transaction(async (tx) => {
        await tx.healthUnit.updateMany({
          where: { isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
        return tx.healthUnit.update({ where: { id }, data: dto });
      });
    }
    return this.prisma.healthUnit.update({ where: { id }, data: dto });
  }

  async findDefault(): Promise<HealthUnit | null> {
    return this.prisma.healthUnit.findFirst({
      where: { isDefault: true, deletedAt: null },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.healthUnit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Unidade de saúde removida com sucesso.' };
  }
}
