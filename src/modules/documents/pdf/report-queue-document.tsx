import { Document, Page } from '@react-pdf/renderer';
import type { HealthUnit } from '@prisma/client';
import { DocumentTitle, FilterSummary, formatMinutes, GeneratedAt, KpiRow, Letterhead, pdfStyles, ReportTable, SectionTitle } from './layout';

export interface QueueSummary {
  totalCalls: number;
  avgWaitMinutes: number | null;
  avgServiceMinutes: number | null;
  totalRecalls: number;
}

export interface QueueByUnitRow {
  healthUnitId: string;
  healthUnitName: string | null;
  calls: number;
  avgWaitMinutes: number | null;
  recalls: number;
}

export function QueueReportDocument({
  summary,
  byUnit,
  filtersText,
  healthUnit,
}: {
  summary: QueueSummary;
  byUnit: QueueByUnitRow[];
  filtersText: string;
  healthUnit: HealthUnit | null;
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Letterhead healthUnit={healthUnit} />
        <DocumentTitle>Relatório de Fila e Tempo de Chamada</DocumentTitle>
        <FilterSummary text={filtersText} />

        <KpiRow
          items={[
            { label: 'Total de chamadas', value: String(summary.totalCalls) },
            { label: 'Espera média', value: formatMinutes(summary.avgWaitMinutes) },
            { label: 'Atendimento médio', value: formatMinutes(summary.avgServiceMinutes) },
            { label: 'Rechamadas', value: String(summary.totalRecalls) },
          ]}
        />

        <SectionTitle>Por unidade</SectionTitle>
        <ReportTable
          headers={['Unidade', 'Chamadas', 'Espera média', 'Rechamadas']}
          rows={byUnit.map((row) => [
            row.healthUnitName ?? '—',
            row.calls,
            formatMinutes(row.avgWaitMinutes),
            row.recalls,
          ])}
        />

        <GeneratedAt />
      </Page>
    </Document>
  );
}
