import { Document, Page } from '@react-pdf/renderer';
import type { HealthUnit } from '@prisma/client';
import { DocumentTitle, FilterSummary, formatMinutes, GeneratedAt, Letterhead, pdfStyles, ReportTable } from './layout';

export interface ProductivityRow {
  professionalId: string;
  professionalName: string | null;
  total: number;
  attended: number;
  noShow: number;
  attendanceRate: number;
  avgWaitMinutes: number | null;
  avgServiceMinutes: number | null;
}

export function ProductivityReportDocument({
  rows,
  filtersText,
  healthUnit,
}: {
  rows: ProductivityRow[];
  filtersText: string;
  healthUnit: HealthUnit | null;
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Letterhead healthUnit={healthUnit} />
        <DocumentTitle>Relatório de Produtividade por Profissional</DocumentTitle>
        <FilterSummary text={filtersText} />

        <ReportTable
          headers={['Profissional', 'Total', 'Atendidas', 'Faltas', 'Taxa', 'Espera média', 'Atend. médio']}
          rows={rows.map((row) => [
            row.professionalName ?? '—',
            row.total,
            row.attended,
            row.noShow,
            `${row.attendanceRate}%`,
            formatMinutes(row.avgWaitMinutes),
            formatMinutes(row.avgServiceMinutes),
          ])}
        />

        <GeneratedAt />
      </Page>
    </Document>
  );
}
