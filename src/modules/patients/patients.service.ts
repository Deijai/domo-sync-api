import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, Patient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination/paginate.util';
import { hashPassword } from '../../common/utils/password.util';
import { assertPrincipalType } from '../../common/utils/principal.util';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PublicRegisterPatientDto } from './dto/public-register-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { QueryPatientsDto } from './dto/query-patients.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPatientsDto) {
    const { page = 1, pageSize = 10, search, status, orderBy = 'createdAt', orderDirection = 'desc' } = query;

    const where = {
      deletedAt: null,
      ...(status ? { status: status as AccountStatus } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { cpf: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    return paginate(
      () => this.prisma.patient.count({ where }),
      async (skip, take) => {
        const patients = await this.prisma.patient.findMany({
          where,
          skip,
          take,
          orderBy: { [orderBy]: orderDirection },
        });
        return patients.map((patient) => this.toResponse(patient));
      },
      page,
      pageSize,
    );
  }

  async findOne(id: string) {
    const patient = await this.findPatientOrThrow(id);
    return this.toResponse(patient);
  }

  async create(dto: CreatePatientDto) {
    const patient = await this.persist(dto, dto.status ?? 'ACTIVE');
    return patient;
  }

  async publicRegister(dto: PublicRegisterPatientDto) {
    return this.persist(dto, 'ACTIVE');
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findPatientOrThrow(id);

    const patient = await this.prisma.patient.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        rg: dto.rg,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        motherName: dto.motherName,
        fatherName: dto.fatherName,
        susCard: dto.susCard,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        zipCode: dto.zipCode,
        state: dto.state,
        city: dto.city,
        neighborhood: dto.neighborhood,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        referencePoint: dto.referencePoint,
        status: dto.status,
        ...(dto.password ? { passwordHash: await hashPassword(dto.password) } : {}),
      },
    });

    return this.toResponse(patient);
  }

  async remove(id: string) {
    await this.findPatientOrThrow(id);

    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Paciente removido com sucesso.' };
  }

  async getMyProfile(principal: JwtPayload) {
    assertPrincipalType(principal, 'PATIENT');
    const patient = await this.findPatientOrThrow(principal.sub);
    return this.toResponse(patient);
  }

  async updateMyProfile(principal: JwtPayload, dto: UpdatePatientProfileDto) {
    assertPrincipalType(principal, 'PATIENT');
    await this.findPatientOrThrow(principal.sub);

    const patient = await this.prisma.patient.update({
      where: { id: principal.sub },
      data: {
        fullName: dto.fullName,
        rg: dto.rg,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        gender: dto.gender,
        motherName: dto.motherName,
        fatherName: dto.fatherName,
        susCard: dto.susCard,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        zipCode: dto.zipCode,
        state: dto.state,
        city: dto.city,
        neighborhood: dto.neighborhood,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        referencePoint: dto.referencePoint,
      },
    });

    return this.toResponse(patient);
  }

  private async persist(dto: CreatePatientDto | PublicRegisterPatientDto, status: AccountStatus) {
    const passwordHash = await hashPassword(dto.password);

    const patient = await this.prisma.patient.create({
      data: {
        fullName: dto.fullName,
        cpf: dto.cpf,
        rg: dto.rg,
        birthDate: new Date(dto.birthDate),
        gender: dto.gender,
        motherName: dto.motherName,
        fatherName: dto.fatherName,
        susCard: dto.susCard,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        email: dto.email,
        passwordHash,
        zipCode: dto.zipCode,
        state: dto.state,
        city: dto.city,
        neighborhood: dto.neighborhood,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        referencePoint: dto.referencePoint,
        status,
      },
    });

    return this.toResponse(patient);
  }

  private async findPatientOrThrow(id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findFirst({ where: { id, deletedAt: null } });
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }
    return patient;
  }

  private toResponse(patient: Patient) {
    const { passwordHash: _passwordHash, ...safe } = patient;
    return safe;
  }
}
