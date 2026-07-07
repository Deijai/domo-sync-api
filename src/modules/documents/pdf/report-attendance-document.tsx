import { Document, Page } from '@react-pdf/renderer';
import type { HealthUnit } from '@prisma/client';
import { DocumentTitle, FilterSummary, GeneratedAt, KpiRow, Letterhead, pdfStyles, ReportTable, SectionTitle } from './layout';

export interface AttendanceSummary {
  attended: number;
  noShow: number;
  totalConcluded: number;
  attendanceRate: number;
  noShowRate: number;
}

export interface AttendanceByUnitRow {
  healthUnitId: string;
  healthUnitName: string | null;
  attended: number;
  noShow: number;
  attendanceRate: number;
}

export interface AttendanceByProfessionalRow {
  professionalId: string;
  professionalName: string | null;
  attended: number;
  noShow: number;
  attendanceRate: number;
}

export function AttendanceReportDocument({
  summary,
  byUnit,
  byProfessional,
  filtersText,
  healthUnit,
}: {
  summary: AttendanceSummary;
  byUnit: AttendanceByUnitRow[];
  byProfessional: AttendanceByProfessionalRow[];
  filtersText: string;
  healthUnit: HealthUnit | null;
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Letterhead healthUnit={healthUnit} />
        <DocumentTitle>Relatório de Atendimento vs Falta</DocumentTitle>
        <FilterSummary text={filtersText} />

        <KpiRow
          items={[
            { label: 'Concluídas', value: String(summary.totalConcluded) },
            { label: 'Atendidas', value: String(summary.attended) },
            { label: 'Faltas', value: String(summary.noShow) },
            { label: 'Taxa de comparecimento', value: `${summary.attendanceRate}%` },
            { label: 'Taxa de falta', value: `${summary.noShowRate}%` },
          ]}
        />

        <SectionTitle>Por unidade</SectionTitle>
        <ReportTable
          headers={['Unidade', 'Atendidas', 'Faltas', 'Taxa de comparecimento']}
          rows={byUnit.map((row) => [row.healthUnitName ?? '—', row.attended, row.noShow, `${row.attendanceRate}%`])}
        />

        <SectionTitle>Por profissional</SectionTitle>
        <ReportTable
          headers={['Profissional', 'Atendidas', 'Faltas', 'Taxa de comparecimento']}
          rows={byProfessional.map((row) => [
            row.professionalName ?? '—',
            row.attended,
            row.noShow,
            `${row.attendanceRate}%`,
          ])}
        />

        <GeneratedAt />
      </Page>
    </Document>
  );
}
