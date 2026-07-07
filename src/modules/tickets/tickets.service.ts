import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Ticket, TicketMovementAction, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination/paginate.util';
import { CreateTicketBatchDto } from './dto/create-ticket-batch.dto';
import { QueryTicketBatchesDto } from './dto/query-ticket-batches.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { CancelTicketDto } from './dto/cancel-ticket.dto';
import { TransferTicketDto } from './dto/transfer-ticket.dto';
import { ChangeDateTicketDto } from './dto/change-date-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';

const OPEN_STATUSES: TicketStatus[] = ['RESERVED', 'CONFIRMED', 'ATTENDED', 'CANCELED', 'NO_SHOW'];

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== Batches ====================

  async createBatch(dto: CreateTicketBatchDto, actorUserId: string) {
    const serviceDate = new Date(dto.serviceDate);
    this.assertNotPastDate(serviceDate);

    const [specialty, professional, healthUnit] = await Promise.all([
      this.prisma.specialty.findFirst({ where: { id: dto.specialtyId, deletedAt: null } }),
      this.prisma.professional.findFirst({
        where: { id: dto.professionalId, deletedAt: null },
        include: { specialties: true },
      }),
      this.prisma.healthUnit.findFirst({ where: { id: dto.healthUnitId, deletedAt: null } }),
    ]);

    if (!specialty || specialty.status !== 'ACTIVE') {
      throw new BadRequestException('Especialidade inválida ou inativa.');
    }
    if (!professional || professional.status !== 'ACTIVE') {
      throw new BadRequestException('Profissional inválido ou inativo.');
    }
    if (!healthUnit || healthUnit.status !== 'ACTIVE') {
      throw new BadRequestException('Unidade de saúde inválida ou inativa.');
    }
    const attendsSpecialty = professional.specialties.some((ps) => ps.specialtyId === dto.specialtyId);
    if (!attendsSpecialty) {
      throw new BadRequestException('Este profissional não atende a especialidade informada.');
    }

    const batch = await this.prisma.$transaction(
      async (tx) => {
        const createdBatch = await tx.ticketBatch.create({
          data: {
            description: dto.description,
            specialtyId: dto.specialtyId,
            professionalId: dto.professionalId,
            healthUnitId: dto.healthUnitId,
            serviceDate,
            totalTickets: dto.totalTickets,
            startTime: dto.startTime,
            endTime: dto.endTime,
            arrivalInstruction: dto.arrivalInstruction ?? undefined,
            createdByUserId: actorUserId,
            status: 'ACTIVE',
          },
        });

        for (let ticketNumber = 1; ticketNumber <= dto.totalTickets; ticketNumber++) {
          const ticket = await tx.ticket.create({
            data: {
              ticketNumber,
              batchId: createdBatch.id,
              specialtyId: dto.specialtyId,
              professionalId: dto.professionalId,
              healthUnitId: dto.healthUnitId,
              serviceDate,
              scheduledTime: dto.startTime,
              arrivalInstruction: createdBatch.arrivalInstruction,
              status: 'AVAILABLE',
              createdByUserId: actorUserId,
            },
          });

          await tx.ticketMovement.create({
            data: {
              ticketId: ticket.id,
              toStatus: 'AVAILABLE',
              action: 'CREATED',
              performedByUserId: actorUserId,
            },
          });
        }

        return createdBatch;
      },
      { timeout: 30_000, maxWait: 10_000 },
    );

    return this.findBatchOrThrow(batch.id);
  }

  async findAllBatches(query: QueryTicketBatchesDto) {
    const { page = 1, pageSize = 10, search, status, specialtyId, professionalId, healthUnitId, startDate, endDate } =
      query;

    const where: Prisma.TicketBatchWhereInput = {
      deletedAt: null,
      ...(status ? { status: status as Prisma.EnumTicketBatchStatusFilter['equals'] } : {}),
      ...(specialtyId ? { specialtyId } : {}),
      ...(professionalId ? { professionalId } : {}),
      ...(healthUnitId ? { healthUnitId } : {}),
      ...(startDate || endDate
        ? {
            serviceDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search ? { description: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    return paginate(
      () => this.prisma.ticketBatch.count({ where }),
      (skip, take) =>
        this.prisma.ticketBatch.findMany({
          where,
          skip,
          take,
          orderBy: { serviceDate: 'desc' },
          include: { specialty: true, professional: true, healthUnit: true },
        }),
      page,
      pageSize,
    );
  }

  async findBatchDetail(id: string) {
    const batch = await this.findBatchOrThrow(id);

    const statusCounts = await this.prisma.ticket.groupBy({
      by: ['status'],
      where: { batchId: id, deletedAt: null },
      _count: { _all: true },
    });

    return {
      ...batch,
      ticketsByStatus: statusCounts.reduce<Record<string, number>>((acc, row) => {
        acc[row.status] = row._count._all;
        return acc;
      }, {}),
    };
  }

  // ==================== Tickets (admin) ====================

  async createTicket(dto: CreateTicketDto, actorUserId: string) {
    const serviceDate = new Date(dto.serviceDate);
    this.assertNotPastDate(serviceDate);

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber: 1,
        specialtyId: dto.specialtyId,
        professionalId: dto.professionalId,
        healthUnitId: dto.healthUnitId,
        serviceDate,
        scheduledTime: dto.scheduledTime,
        arrivalInstruction: dto.arrivalInstruction ?? 'Compareça com 1 hora de antecedência.',
        status: 'AVAILABLE',
        createdByUserId: actorUserId,
      },
    });

    await this.recordMovement(ticket.id, null, 'AVAILABLE', 'CREATED', undefined, { userId: actorUserId });

    return this.findTicketOrThrow(ticket.id);
  }

  async findAllTickets(query: QueryTicketsDto) {
    const {
      page = 1,
      pageSize = 10,
      status,
      specialtyId,
      professionalId,
      healthUnitId,
      patientId,
      batchId,
      startDate,
      endDate,
      orderBy = 'serviceDate',
      orderDirection = 'desc',
    } = query;

    const where: Prisma.TicketWhereInput = {
      deletedAt: null,
      ...(status ? { status: status as Prisma.EnumTicketStatusFilter['equals'] } : {}),
      ...(specialtyId ? { specialtyId } : {}),
      ...(professionalId ? { professionalId } : {}),
      ...(healthUnitId ? { healthUnitId } : {}),
      ...(patientId ? { patientId } : {}),
      ...(batchId ? { batchId } : {}),
      ...(startDate || endDate
        ? {
            serviceDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    return paginate(
      () => this.prisma.ticket.count({ where }),
      (skip, take) =>
        this.prisma.ticket.findMany({
          where,
          skip,
          take,
          orderBy: { [orderBy]: orderDirection },
          include: { specialty: true, professional: true, healthUnit: true, patient: true },
        }),
      page,
      pageSize,
    );
  }

  async findTicketDetail(id: string) {
    return this.findTicketOrThrow(id, {
      specialty: true,
      professional: true,
      healthUnit: true,
      patient: true,
      batch: true,
    });
  }

  async updateTicket(ticketId: string, dto: UpdateTicketDto) {
    await this.findTicketOrThrow(ticketId);
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        scheduledTime: dto.scheduledTime,
        arrivalInstruction: dto.arrivalInstruction,
      },
    });
  }

  async findMovements(ticketId: string, query: PaginationQueryDto) {
    await this.findTicketOrThrow(ticketId);
    const { page = 1, pageSize = 10 } = query;

    return paginate(
      () => this.prisma.ticketMovement.count({ where: { ticketId } }),
      (skip, take) =>
        this.prisma.ticketMovement.findMany({
          where: { ticketId },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
      page,
      pageSize,
    );
  }

  async cancel(ticketId: string, dto: CancelTicketDto, actorUserId: string) {
    const ticket = await this.findTicketOrThrow(ticketId);

    if (!['AVAILABLE', 'RESERVED'].includes(ticket.status)) {
      throw new BadRequestException('Só é possível cancelar fichas disponíveis ou reservadas.');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        canceledReason: dto.reason,
        updatedByUserId: actorUserId,
      },
    });

    await this.recordMovement(ticketId, ticket.status, 'CANCELED', 'CANCELED', dto.reason, {
      userId: actorUserId,
    });

    return updated;
  }

  async transfer(ticketId: string, dto: TransferTicketDto, actorUserId: string) {
    if (!dto.newPatientId && !dto.newProfessionalId && !dto.newServiceDate) {
      throw new BadRequestException(
        'Informe ao menos um destino de transferência (paciente, profissional ou data).',
      );
    }

    const ticket = await this.findTicketOrThrow(ticketId);

    if (!['AVAILABLE', 'RESERVED', 'CONFIRMED'].includes(ticket.status)) {
      throw new BadRequestException('Só é possível transferir fichas disponíveis, reservadas ou confirmadas.');
    }

    if (dto.newServiceDate) {
      this.assertNotPastDate(new Date(dto.newServiceDate));
    }

    return this.prisma.$transaction(async (tx) => {
      const nextTicketNumber = ticket.batchId
        ? ((await tx.ticket.aggregate({
            where: { batchId: ticket.batchId },
            _max: { ticketNumber: true },
          }))._max.ticketNumber ?? 0) + 1
        : 1;

      const carriesPatient = dto.newPatientId ?? ticket.patientId;

      const newTicket = await tx.ticket.create({
        data: {
          ticketNumber: nextTicketNumber,
          batchId: ticket.batchId,
          specialtyId: ticket.specialtyId,
          professionalId: dto.newProfessionalId ?? ticket.professionalId,
          healthUnitId: ticket.healthUnitId,
          patientId: carriesPatient,
          serviceDate: dto.newServiceDate ? new Date(dto.newServiceDate) : ticket.serviceDate,
          scheduledTime: ticket.scheduledTime,
          arrivalInstruction: ticket.arrivalInstruction,
          status: carriesPatient ? 'RESERVED' : 'AVAILABLE',
          reservedAt: carriesPatient ? new Date() : null,
          createdByUserId: actorUserId,
        },
      });

      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'TRANSFERRED',
          transferredAt: new Date(),
          updatedByUserId: actorUserId,
        },
      });

      await tx.ticketMovement.create({
        data: {
          ticketId,
          fromStatus: ticket.status,
          toStatus: 'TRANSFERRED',
          action: 'TRANSFERRED',
          description: dto.reason,
          performedByUserId: actorUserId,
          metadata: { transferredToTicketId: newTicket.id },
        },
      });

      await tx.ticketMovement.create({
        data: {
          ticketId: newTicket.id,
          toStatus: newTicket.status,
          action: 'CREATED',
          description: 'Ficha originada de transferência.',
          performedByUserId: actorUserId,
          metadata: { transferredFromTicketId: ticketId },
        },
      });

      return newTicket;
    });
  }

  async changeDate(ticketId: string, dto: ChangeDateTicketDto, actorUserId: string) {
    const ticket = await this.findTicketOrThrow(ticketId);
    const terminalStatuses: TicketStatus[] = ['CANCELED', 'ATTENDED', 'NO_SHOW', 'EXPIRED', 'TRANSFERRED'];

    if (terminalStatuses.includes(ticket.status)) {
      throw new BadRequestException('Não é possível alterar a data de uma ficha neste status.');
    }

    const newServiceDate = new Date(dto.newServiceDate);
    this.assertNotPastDate(newServiceDate);

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        serviceDate: newServiceDate,
        scheduledTime: dto.newScheduledTime ?? ticket.scheduledTime,
        updatedByUserId: actorUserId,
      },
    });

    await this.recordMovement(ticketId, ticket.status, ticket.status, 'DATE_CHANGED', undefined, {
      userId: actorUserId,
      metadata: { previousServiceDate: ticket.serviceDate, newServiceDate },
    });

    return updated;
  }

  async confirmPresence(ticketId: string, actorUserId: string) {
    const ticket = await this.findTicketOrThrow(ticketId);

    if (ticket.status !== 'RESERVED') {
      throw new BadRequestException('Só é possível confirmar presença de fichas reservadas.');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), updatedByUserId: actorUserId },
    });

    await this.recordMovement(ticketId, 'RESERVED', 'CONFIRMED', 'CONFIRMED', undefined, {
      userId: actorUserId,
    });

    return updated;
  }

  async attend(ticketId: string, actorUserId: string) {
    const ticket = await this.findTicketOrThrow(ticketId);

    if (ticket.status !== 'CONFIRMED') {
      throw new BadRequestException('Só é possível marcar atendimento de fichas confirmadas.');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'ATTENDED', attendedAt: new Date(), updatedByUserId: actorUserId },
    });

    await this.recordMovement(ticketId, 'CONFIRMED', 'ATTENDED', 'ATTENDED', undefined, {
      userId: actorUserId,
    });

    return updated;
  }

  async noShow(ticketId: string, actorUserId: string) {
    const ticket = await this.findTicketOrThrow(ticketId);

    if (!['RESERVED', 'CONFIRMED'].includes(ticket.status)) {
      throw new BadRequestException('Só é possível marcar falta em fichas reservadas ou confirmadas.');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'NO_SHOW', updatedByUserId: actorUserId },
    });

    await this.recordMovement(ticketId, ticket.status, 'NO_SHOW', 'NO_SHOW', undefined, {
      userId: actorUserId,
    });

    return updated;
  }

  async reopen(ticketId: string, actorUserId: string) {
    const ticket = await this.findTicketOrThrow(ticketId);

    if (ticket.status !== 'CANCELED') {
      throw new BadRequestException('Só é possível reabrir fichas canceladas.');
    }

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'AVAILABLE',
        patientId: null,
        canceledAt: null,
        canceledReason: null,
        reservedAt: null,
        updatedByUserId: actorUserId,
      },
    });

    await this.recordMovement(ticketId, 'CANCELED', 'AVAILABLE', 'REOPENED', undefined, {
      userId: actorUserId,
    });

    return updated;
  }

  // ==================== Mobile / Patient ====================

  async findOpenTicketsForMobile(query: QueryTicketsDto) {
    const {
      page = 1,
      pageSize = 10,
      specialtyId,
      professionalId,
      healthUnitId,
      startDate,
      endDate,
    } = query;

    const where: Prisma.TicketWhereInput = {
      deletedAt: null,
      status: 'AVAILABLE',
      serviceDate: {
        gte: this.startOfToday(),
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(endDate) } : {}),
      },
      ...(specialtyId ? { specialtyId } : {}),
      ...(professionalId ? { professionalId } : {}),
      ...(healthUnitId ? { healthUnitId } : {}),
    };

    return paginate(
      () => this.prisma.ticket.count({ where }),
      (skip, take) =>
        this.prisma.ticket.findMany({
          where,
          skip,
          take,
          orderBy: { serviceDate: 'asc' },
          include: { specialty: true, professional: true, healthUnit: true },
        }),
      page,
      pageSize,
    );
  }

  async findOpenTicketDetailForMobile(id: string) {
    return this.findTicketOrThrow(id, { specialty: true, professional: true, healthUnit: true });
  }

  async reserve(ticketId: string, patientId: string) {
    const ticket = await this.prisma.$transaction(async (tx) => {
      const result = await tx.ticket.updateMany({
        where: {
          id: ticketId,
          status: 'AVAILABLE',
          patientId: null,
          serviceDate: { gte: this.startOfToday() },
          deletedAt: null,
        },
        data: {
          status: 'RESERVED',
          patientId,
          reservedAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Esta ficha não está mais disponível. Escolha outra ficha.',
        );
      }

      await tx.ticketMovement.create({
        data: {
          ticketId,
          fromStatus: 'AVAILABLE',
          toStatus: 'RESERVED',
          action: 'RESERVED',
          performedByPatientId: patientId,
        },
      });

      return tx.ticket.findUniqueOrThrow({
        where: { id: ticketId },
        include: { specialty: true, professional: true, healthUnit: true },
      });
    });

    return ticket;
  }

  async cancelReservation(ticketId: string, patientId: string) {
    const ticket = await this.prisma.$transaction(async (tx) => {
      const current = await tx.ticket.findFirst({ where: { id: ticketId, deletedAt: null } });
      if (!current || current.patientId !== patientId) {
        throw new NotFoundException('Ficha não encontrada ou não pertence a você.');
      }

      if (!['RESERVED', 'CONFIRMED'].includes(current.status)) {
        throw new BadRequestException('Esta ficha não pode mais ser cancelada.');
      }

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'AVAILABLE',
          patientId: null,
          reservedAt: null,
          confirmedAt: null,
        },
      });

      await tx.ticketMovement.create({
        data: {
          ticketId,
          fromStatus: current.status,
          toStatus: 'AVAILABLE',
          action: 'CANCELED',
          description: 'Reserva cancelada pelo paciente.',
          performedByPatientId: patientId,
        },
      });

      return updated;
    });

    return ticket;
  }

  async findMyTickets(patientId: string, query: PaginationQueryDto) {
    const { page = 1, pageSize = 10 } = query;

    const where: Prisma.TicketWhereInput = {
      patientId,
      deletedAt: null,
      status: { in: ['RESERVED', 'CONFIRMED'] },
    };

    return paginate(
      () => this.prisma.ticket.count({ where }),
      (skip, take) =>
        this.prisma.ticket.findMany({
          where,
          skip,
          take,
          orderBy: { serviceDate: 'asc' },
          include: { specialty: true, professional: true, healthUnit: true },
        }),
      page,
      pageSize,
    );
  }

  async findMyHistory(patientId: string, query: PaginationQueryDto) {
    const { page = 1, pageSize = 10 } = query;

    const where: Prisma.TicketWhereInput = {
      patientId,
      deletedAt: null,
      status: { in: OPEN_STATUSES },
    };

    return paginate(
      () => this.prisma.ticket.count({ where }),
      (skip, take) =>
        this.prisma.ticket.findMany({
          where,
          skip,
          take,
          orderBy: { serviceDate: 'desc' },
          include: { specialty: true, professional: true, healthUnit: true },
        }),
      page,
      pageSize,
    );
  }

  // ==================== Helpers ====================

  private async findBatchOrThrow(id: string) {
    const batch = await this.prisma.ticketBatch.findFirst({
      where: { id, deletedAt: null },
      include: { specialty: true, professional: true, healthUnit: true },
    });
    if (!batch) {
      throw new NotFoundException('Lote de fichas não encontrado.');
    }
    return batch;
  }

  private async findTicketOrThrow(id: string, include?: Prisma.TicketInclude): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      include,
    });
    if (!ticket) {
      throw new NotFoundException('Ficha não encontrada.');
    }
    return ticket;
  }

  private async recordMovement(
    ticketId: string,
    fromStatus: TicketStatus | null,
    toStatus: TicketStatus,
    action: TicketMovementAction,
    description?: string,
    actor?: { userId?: string; patientId?: string; metadata?: Record<string, unknown> },
  ) {
    await this.prisma.ticketMovement.create({
      data: {
        ticketId,
        fromStatus: fromStatus ?? undefined,
        toStatus,
        action,
        description,
        performedByUserId: actor?.userId,
        performedByPatientId: actor?.patientId,
        metadata: actor?.metadata as Prisma.InputJsonValue,
      },
    });
  }

  private assertNotPastDate(date: Date) {
    if (date < this.startOfToday()) {
      throw new BadRequestException('A data não pode estar no passado.');
    }
  }

  private startOfToday(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
