import { Injectable, NotFoundException } from '@nestjs/common';
import { SimpleStatus, Specialty } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination/paginate.util';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
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
      () => this.prisma.specialty.count({ where }),
      (skip, take) =>
        this.prisma.specialty.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      page,
      pageSize,
    );
  }

  async findOne(id: string): Promise<Specialty> {
    const specialty = await this.prisma.specialty.findFirst({ where: { id, deletedAt: null } });
    if (!specialty) {
      throw new NotFoundException('Especialidade não encontrada.');
    }
    return specialty;
  }

  create(dto: CreateSpecialtyDto) {
    return this.prisma.specialty.create({ data: dto });
  }

  async update(id: string, dto: UpdateSpecialtyDto) {
    await this.findOne(id);
    return this.prisma.specialty.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.specialty.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Especialidade removida com sucesso.' };
  }
}
