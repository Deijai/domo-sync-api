import { Injectable } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import type { HealthUnit } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports-query.dto';
import { AttendanceReportDocument } from '../documents/pdf/report-attendance-document';
import { ProductivityReportDocument } from '../documents/pdf/report-productivity-document';
import { VolumeReportDocument } from '../documents/pdf/report-volume-document';
import { QueueReportDocument } from '../documents/pdf/report-queue-document';

@Injectable()
export class ReportsPdfService {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {}

  async attendancePdf(query: ReportsQueryDto): Promise<Buffer> {
    const [summary, byUnit, byProfessional, context] = await Promise.all([
      this.reportsService.attendanceRate(query),
      this.reportsService.attendanceByUnit(query),
      this.reportsService.attendanceByProfessional(query),
      this.resolveContext(query),
    ]);

    return renderToBuffer(
      <AttendanceReportDocument
        summary={summary}
        byUnit={byUnit}
        byProfessional={byProfessional}
        filtersText={context.filtersText}
        healthUnit={context.healthUnit}
      />,
    );
  }

  async productivityPdf(query: ReportsQueryDto): Promise<Buffer> {
    const [rows, context] = await Promise.all([
      this.reportsService.productivityByProfessional(query),
      this.resolveContext(query),
    ]);

    return renderToBuffer(
      <ProductivityReportDocument rows={rows} filtersText={context.filtersText} healthUnit={context.healthUnit} />,
    );
  }

  async volumePdf(query: ReportsQueryDto): Promise<Buffer> {
    const [bySpecialty, byUnit, context] = await Promise.all([
      this.reportsService.volumeBySpecialty(query),
      this.reportsService.volumeByUnit(query),
      this.resolveContext(query),
    ]);

    return renderToBuffer(
      <VolumeReportDocument
        bySpecialty={bySpecialty}
        byUnit={byUnit}
        filtersText={context.filtersText}
        healthUnit={context.healthUnit}
      />,
    );
  }

  async queuePdf(query: ReportsQueryDto): Promise<Buffer> {
    const [summary, byUnit, context] = await Promise.all([
      this.reportsService.queueMetrics(query),
      this.reportsService.queueByUnit(query),
      this.resolveContext(query),
    ]);

    return renderToBuffer(
      <QueueReportDocument summary={summary} byUnit={byUnit} filtersText={context.filtersText} healthUnit={context.healthUnit} />,
    );
  }

  private async resolveContext(query: ReportsQueryDto): Promise<{ healthUnit: HealthUnit | null; filtersText: string }> {
    const [healthUnit, specialty, professional] = await Promise.all([
      query.healthUnitId ? this.prisma.healthUnit.findFirst({ where: { id: query.healthUnitId } }) : null,
      query.specialtyId ? this.prisma.specialty.findFirst({ where: { id: query.specialtyId } }) : null,
      query.professionalId ? this.prisma.professional.findFirst({ where: { id: query.professionalId } }) : null,
    ]);

    const parts: string[] = [];
    if (query.startDate || query.endDate) {
      const from = query.startDate ? new Date(query.startDate).toLocaleDateString('pt-BR') : '—';
      const to = query.endDate ? new Date(query.endDate).toLocaleDateString('pt-BR') : '—';
      parts.push(`Período: ${from} a ${to}`);
    } else {
      parts.push('Período: todos');
    }
    parts.push(`Unidade: ${healthUnit?.name ?? 'Todas'}`);
    parts.push(`Especialidade: ${specialty?.name ?? 'Todas'}`);
    parts.push(`Profissional: ${professional?.fullName ?? 'Todos'}`);

    return { healthUnit, filtersText: parts.join(' · ') };
  }
}
