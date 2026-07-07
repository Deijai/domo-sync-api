import { Document, Page } from '@react-pdf/renderer';
import type { HealthUnit } from '@prisma/client';
import { DocumentTitle, FilterSummary, GeneratedAt, Letterhead, pdfStyles, ReportTable, SectionTitle } from './layout';

export interface VolumeBySpecialtyRow {
  specialtyId: string;
  specialtyName: string | null;
  total: number;
  reserved: number;
  attended: number;
  canceled: number;
}

export interface VolumeByUnitRow {
  healthUnitId: string;
  healthUnitName: string | null;
  total: number;
  reserved: number;
  attended: number;
  canceled: number;
}

export function VolumeReportDocument({
  bySpecialty,
  byUnit,
  filtersText,
  healthUnit,
}: {
  bySpecialty: VolumeBySpecialtyRow[];
  byUnit: VolumeByUnitRow[];
  filtersText: string;
  healthUnit: HealthUnit | null;
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Letterhead healthUnit={healthUnit} />
        <DocumentTitle>Relatório de Volume por Especialidade e Unidade</DocumentTitle>
        <FilterSummary text={filtersText} />

        <SectionTitle>Por especialidade</SectionTitle>
        <ReportTable
          headers={['Especialidade', 'Geradas', 'Reservadas em diante', 'Atendidas', 'Canceladas']}
          rows={bySpecialty.map((row) => [
            row.specialtyName ?? '—',
            row.total,
            row.reserved,
            row.attended,
            row.canceled,
          ])}
        />

        <SectionTitle>Por unidade</SectionTitle>
        <ReportTable
          headers={['Unidade', 'Geradas', 'Reservadas em diante', 'Atendidas', 'Canceladas']}
          rows={byUnit.map((row) => [row.healthUnitName ?? '—', row.total, row.reserved, row.attended, row.canceled])}
        />

        <GeneratedAt />
      </Page>
    </Document>
  );
}
