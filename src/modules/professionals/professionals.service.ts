import { Injectable, NotFoundException } from '@nestjs/common';
import { Professional, ProfessionalSpecialty, SimpleStatus, Specialty } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination/paginate.util';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { SetProfessionalSpecialtiesDto } from './dto/set-professional-specialties.dto';

type ProfessionalWithSpecialties = Professional & {
  specialties: (ProfessionalSpecialty & { specialty: Specialty })[];
};

@Injectable()
export class ProfessionalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, pageSize = 10, search, status } = query;

    const where = {
      deletedAt: null,
      ...(status ? { status: status as SimpleStatus } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { cpf: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return paginate<ReturnType<typeof this.toResponse>>(
      () => this.prisma.professional.count({ where }),
      async (skip, take) => {
        const professionals = await this.prisma.professional.findMany({
          where,
          skip,
          take,
          orderBy: { fullName: 'asc' },
          include: { specialties: { include: { specialty: true } } },
        });
        return professionals.map((professional) => this.toResponse(professional));
      },
      page,
      pageSize,
    );
  }

  async findOne(id: string) {
    const professional = await this.findProfessionalOrThrow(id);
    return this.toResponse(professional);
  }

  async create(dto: CreateProfessionalDto) {
    const professional = await this.prisma.professional.create({
      data: dto,
      include: { specialties: { include: { specialty: true } } },
    });
    return this.toResponse(professional);
  }

  async update(id: string, dto: UpdateProfessionalDto) {
    await this.findProfessionalOrThrow(id);

    const professional = await this.prisma.professional.update({
      where: { id },
      data: dto,
      include: { specialties: { include: { specialty: true } } },
    });

    return this.toResponse(professional);
  }

  async remove(id: string) {
    await this.findProfessionalOrThrow(id);

    await this.prisma.professional.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Profissional removido com sucesso.' };
  }

  async setSpecialties(id: string, dto: SetProfessionalSpecialtiesDto) {
    await this.findProfessionalOrThrow(id);

    await this.prisma.$transaction([
      this.prisma.professionalSpecialty.deleteMany({ where: { professionalId: id } }),
      this.prisma.professionalSpecialty.createMany({
        data: dto.specialtyIds.map((specialtyId) => ({ professionalId: id, specialtyId })),
        skipDuplicates: true,
      }),
    ]);

    const professional = await this.findProfessionalOrThrow(id);
    return this.toResponse(professional);
  }

  private async findProfessionalOrThrow(id: string): Promise<ProfessionalWithSpecialties> {
    const professional = await this.prisma.professional.findFirst({
      where: { id, deletedAt: null },
      include: { specialties: { include: { specialty: true } } },
    });

    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    return professional;
  }

  private toResponse(professional: ProfessionalWithSpecialties) {
    return {
      id: professional.id,
      fullName: professional.fullName,
      cpf: professional.cpf,
      councilType: professional.councilType,
      councilNumber: professional.councilNumber,
      councilState: professional.councilState,
      phone: professional.phone,
      email: professional.email,
      status: professional.status,
      specialties: professional.specialties.map((professionalSpecialty) => ({
        id: professionalSpecialty.specialty.id,
        name: professionalSpecialty.specialty.name,
      })),
      createdAt: professional.createdAt,
      updatedAt: professional.updatedAt,
    };
  }
}
