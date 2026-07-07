import { Injectable } from '@nestjs/common';
import { Prisma, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsQueryDto } from './dto/reports-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: ReportsQueryDto) {
    const where = this.buildWhere(query);

    const [total, byStatusRaw] = await Promise.all([
      this.prisma.ticket.count({ where }),
      this.prisma.ticket.groupBy({ by: ['status'], where, _count: { _all: true } }),
    ]);

    const byStatus = this.mapStatusCounts(byStatusRaw);

    return {
      total,
      byStatus,
      attendanceRate: this.rate(byStatus.ATTENDED, byStatus.NO_SHOW),
    };
  }

  async ticketsByStatus(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['status'], where, _count: { _all: true } });
    return rows.map((row) => ({ status: row.status, total: row._count._all }));
  }

  async ticketsBySpecialty(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['specialtyId'], where, _count: { _all: true } });
    const specialties = await this.prisma.specialty.findMany({
      where: { id: { in: rows.map((row) => row.specialtyId) } },
    });

    return rows.map((row) => ({
      specialtyId: row.specialtyId,
      specialtyName: specialties.find((s) => s.id === row.specialtyId)?.name ?? null,
      total: row._count._all,
    }));
  }

  async ticketsByProfessional(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['professionalId'], where, _count: { _all: true } });
    const professionals = await this.prisma.professional.findMany({
      where: { id: { in: rows.map((row) => row.professionalId) } },
    });

    return rows.map((row) => ({
      professionalId: row.professionalId,
      professionalName: professionals.find((p) => p.id === row.professionalId)?.fullName ?? null,
      total: row._count._all,
    }));
  }

  async ticketsByUnit(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['healthUnitId'], where, _count: { _all: true } });
    const units = await this.prisma.healthUnit.findMany({
      where: { id: { in: rows.map((row) => row.healthUnitId) } },
    });

    return rows.map((row) => ({
      healthUnitId: row.healthUnitId,
      healthUnitName: units.find((u) => u.id === row.healthUnitId)?.name ?? null,
      total: row._count._all,
    }));
  }

  async ticketsByPatient(query: ReportsQueryDto) {
    const where = { ...this.buildWhere(query), patientId: { not: null } };
    const rows = await this.prisma.ticket.groupBy({ by: ['patientId'], where, _count: { _all: true } });
    const patientIds = rows.map((row) => row.patientId).filter((id): id is string => Boolean(id));
    const patients = await this.prisma.patient.findMany({ where: { id: { in: patientIds } } });

    return rows.map((row) => ({
      patientId: row.patientId,
      patientName: patients.find((p) => p.id === row.patientId)?.fullName ?? null,
      total: row._count._all,
    }));
  }

  async attendanceRate(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['status'], where, _count: { _all: true } });
    const byStatus = this.mapStatusCounts(rows);
    const totalConcluded = byStatus.ATTENDED + byStatus.NO_SHOW;

    return {
      attended: byStatus.ATTENDED,
      noShow: byStatus.NO_SHOW,
      totalConcluded,
      attendanceRate: this.rate(byStatus.ATTENDED, byStatus.NO_SHOW),
      noShowRate: this.rate(byStatus.NO_SHOW, byStatus.ATTENDED),
    };
  }

  private buildWhere(query: ReportsQueryDto): Prisma.TicketWhereInput {
    const { startDate, endDate, specialtyId, professionalId, healthUnitId, patientId, status } = query;

    return {
      deletedAt: null,
      ...(specialtyId ? { specialtyId } : {}),
      ...(professionalId ? { professionalId } : {}),
      ...(healthUnitId ? { healthUnitId } : {}),
      ...(patientId ? { patientId } : {}),
      ...(status ? { status: status as TicketStatus } : {}),
      ...(startDate || endDate
        ? {
            serviceDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };
  }

  private mapStatusCounts(rows: { status: TicketStatus; _count: { _all: number } }[]) {
    const base: Record<TicketStatus, number> = {
      AVAILABLE: 0,
      RESERVED: 0,
      CONFIRMED: 0,
      ATTENDED: 0,
      CANCELED: 0,
      NO_SHOW: 0,
      TRANSFERRED: 0,
      EXPIRED: 0,
    };
    for (const row of rows) {
      base[row.status] = row._count._all;
    }
    return base;
  }

  private rate(numerator: number, otherOutcome: number): number {
    const denominator = numerator + otherOutcome;
    return denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;
  }
}
