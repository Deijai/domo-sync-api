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

  // ==================== Relatórios gerenciais (PDF) ====================

  async attendanceByUnit(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['healthUnitId', 'status'], where, _count: { _all: true } });
    const grouped = this.pivotAttendance(rows.map((r) => ({ id: r.healthUnitId, status: r.status, count: r._count._all })));
    const units = await this.prisma.healthUnit.findMany({ where: { id: { in: [...grouped.keys()] } } });

    return [...grouped.entries()].map(([id, counts]) => ({
      healthUnitId: id,
      healthUnitName: units.find((u) => u.id === id)?.name ?? null,
      ...counts,
      attendanceRate: this.rate(counts.attended, counts.noShow),
    }));
  }

  async attendanceByProfessional(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['professionalId', 'status'], where, _count: { _all: true } });
    const grouped = this.pivotAttendance(
      rows.map((r) => ({ id: r.professionalId, status: r.status, count: r._count._all })),
    );
    const professionals = await this.prisma.professional.findMany({ where: { id: { in: [...grouped.keys()] } } });

    return [...grouped.entries()].map(([id, counts]) => ({
      professionalId: id,
      professionalName: professionals.find((p) => p.id === id)?.fullName ?? null,
      ...counts,
      attendanceRate: this.rate(counts.attended, counts.noShow),
    }));
  }

  async volumeBySpecialty(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['specialtyId', 'status'], where, _count: { _all: true } });
    const grouped = this.pivotVolume(rows.map((r) => ({ id: r.specialtyId, status: r.status, count: r._count._all })));
    const specialties = await this.prisma.specialty.findMany({ where: { id: { in: [...grouped.keys()] } } });

    return [...grouped.entries()].map(([id, volume]) => ({
      specialtyId: id,
      specialtyName: specialties.find((s) => s.id === id)?.name ?? null,
      ...volume,
    }));
  }

  async volumeByUnit(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const rows = await this.prisma.ticket.groupBy({ by: ['healthUnitId', 'status'], where, _count: { _all: true } });
    const grouped = this.pivotVolume(rows.map((r) => ({ id: r.healthUnitId, status: r.status, count: r._count._all })));
    const units = await this.prisma.healthUnit.findMany({ where: { id: { in: [...grouped.keys()] } } });

    return [...grouped.entries()].map(([id, volume]) => ({
      healthUnitId: id,
      healthUnitName: units.find((u) => u.id === id)?.name ?? null,
      ...volume,
    }));
  }

  async productivityByProfessional(query: ReportsQueryDto) {
    const where = this.buildWhere(query);
    const [countRows, tickets] = await Promise.all([
      this.prisma.ticket.groupBy({ by: ['professionalId', 'status'], where, _count: { _all: true } }),
      this.prisma.ticket.findMany({
        where: { ...where, confirmedAt: { not: null } },
        select: { professionalId: true, confirmedAt: true, calledAt: true, attendedAt: true },
      }),
    ]);

    const counts = new Map<string, { total: number; attended: number; noShow: number }>();
    for (const row of countRows) {
      const entry = counts.get(row.professionalId) ?? { total: 0, attended: 0, noShow: 0 };
      entry.total += row._count._all;
      if (row.status === 'ATTENDED') entry.attended += row._count._all;
      if (row.status === 'NO_SHOW') entry.noShow += row._count._all;
      counts.set(row.professionalId, entry);
    }

    const waitMinutes = new Map<string, number[]>();
    const serviceMinutes = new Map<string, number[]>();
    for (const ticket of tickets) {
      if (ticket.confirmedAt && ticket.calledAt) {
        this.pushTo(waitMinutes, ticket.professionalId, this.minutesBetween(ticket.confirmedAt, ticket.calledAt));
      }
      if (ticket.calledAt && ticket.attendedAt) {
        this.pushTo(serviceMinutes, ticket.professionalId, this.minutesBetween(ticket.calledAt, ticket.attendedAt));
      }
    }

    const professionals = await this.prisma.professional.findMany({ where: { id: { in: [...counts.keys()] } } });

    return [...counts.entries()].map(([id, c]) => ({
      professionalId: id,
      professionalName: professionals.find((p) => p.id === id)?.fullName ?? null,
      total: c.total,
      attended: c.attended,
      noShow: c.noShow,
      attendanceRate: this.rate(c.attended, c.noShow),
      avgWaitMinutes: this.average(waitMinutes.get(id)),
      avgServiceMinutes: this.average(serviceMinutes.get(id)),
    }));
  }

  async queueMetrics(query: ReportsQueryDto) {
    const where = { ...this.buildWhere(query), calledAt: { not: null } };
    const tickets = await this.prisma.ticket.findMany({
      where,
      select: { id: true, confirmedAt: true, calledAt: true, attendedAt: true },
    });

    const { total: totalRecalls } = await this.countRecalls(tickets.map((t) => t.id));

    const waits: number[] = [];
    const services: number[] = [];
    for (const ticket of tickets) {
      if (ticket.confirmedAt && ticket.calledAt) waits.push(this.minutesBetween(ticket.confirmedAt, ticket.calledAt));
      if (ticket.calledAt && ticket.attendedAt) services.push(this.minutesBetween(ticket.calledAt, ticket.attendedAt));
    }

    return {
      totalCalls: tickets.length,
      avgWaitMinutes: this.average(waits),
      avgServiceMinutes: this.average(services),
      totalRecalls,
    };
  }

  async queueByUnit(query: ReportsQueryDto) {
    const where = { ...this.buildWhere(query), calledAt: { not: null } };
    const tickets = await this.prisma.ticket.findMany({
      where,
      select: { id: true, healthUnitId: true, confirmedAt: true, calledAt: true },
    });

    const { byTicket } = await this.countRecalls(tickets.map((t) => t.id));

    const grouped = new Map<string, { calls: number; waits: number[]; recalls: number }>();
    for (const ticket of tickets) {
      const entry = grouped.get(ticket.healthUnitId) ?? { calls: 0, waits: [], recalls: 0 };
      entry.calls += 1;
      if (ticket.confirmedAt && ticket.calledAt) {
        entry.waits.push(this.minutesBetween(ticket.confirmedAt, ticket.calledAt));
      }
      entry.recalls += byTicket.get(ticket.id) ?? 0;
      grouped.set(ticket.healthUnitId, entry);
    }

    const units = await this.prisma.healthUnit.findMany({ where: { id: { in: [...grouped.keys()] } } });

    return [...grouped.entries()].map(([id, g]) => ({
      healthUnitId: id,
      healthUnitName: units.find((u) => u.id === id)?.name ?? null,
      calls: g.calls,
      avgWaitMinutes: this.average(g.waits),
      recalls: g.recalls,
    }));
  }

  private pivotAttendance(rows: Array<{ id: string; status: TicketStatus; count: number }>) {
    const grouped = new Map<string, { attended: number; noShow: number }>();
    for (const row of rows) {
      const entry = grouped.get(row.id) ?? { attended: 0, noShow: 0 };
      if (row.status === 'ATTENDED') entry.attended += row.count;
      if (row.status === 'NO_SHOW') entry.noShow += row.count;
      grouped.set(row.id, entry);
    }
    return grouped;
  }

  private pivotVolume(rows: Array<{ id: string; status: TicketStatus; count: number }>) {
    const grouped = new Map<string, { total: number; reserved: number; attended: number; canceled: number }>();
    for (const row of rows) {
      const entry = grouped.get(row.id) ?? { total: 0, reserved: 0, attended: 0, canceled: 0 };
      entry.total += row.count;
      if (row.status !== 'AVAILABLE') entry.reserved += row.count;
      if (row.status === 'ATTENDED') entry.attended += row.count;
      if (row.status === 'CANCELED') entry.canceled += row.count;
      grouped.set(row.id, entry);
    }
    return grouped;
  }

  private async countRecalls(ticketIds: string[]): Promise<{ total: number; byTicket: Map<string, number> }> {
    if (ticketIds.length === 0) return { total: 0, byTicket: new Map() };

    const movementCounts = await this.prisma.ticketMovement.groupBy({
      by: ['ticketId'],
      where: { ticketId: { in: ticketIds }, action: 'CALLED' },
      _count: { _all: true },
    });

    const byTicket = new Map<string, number>();
    let total = 0;
    for (const row of movementCounts) {
      const extra = Math.max(0, row._count._all - 1);
      byTicket.set(row.ticketId, extra);
      total += extra;
    }
    return { total, byTicket };
  }

  private pushTo(map: Map<string, number[]>, key: string, value: number) {
    const arr = map.get(key);
    if (arr) arr.push(value);
    else map.set(key, [value]);
  }

  private minutesBetween(from: Date, to: Date): number {
    return (to.getTime() - from.getTime()) / 60_000;
  }

  private average(values?: number[]): number | null {
    if (!values || values.length === 0) return null;
    return Number((values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1));
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
      CALLED: 0,
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
