import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from '@react-pdf/renderer';

export interface LetterheadHealthUnit {
  name: string;
  cnpj: string | null;
  logoUrl: string | null;
  institutionName: string | null;
  stateName: string | null;
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  headerLine: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  title: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontFamily: 'Helvetica-Bold',
    width: 140,
  },
  value: {
    flex: 1,
  },
  dateLine: {
    textAlign: 'right',
    marginTop: 32,
  },
  signatureArea: {
    marginTop: 56,
    alignItems: 'center',
  },
  signatureLine: {
    width: 280,
    borderTopWidth: 1,
    borderTopColor: '#111827',
    marginBottom: 4,
  },
  filterSummary: {
    fontSize: 10,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 16,
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
  },
  tableCellHeader: {
    padding: 6,
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  kpiBox: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    padding: 10,
    minWidth: 130,
    marginRight: 12,
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
  },
});

export function FilterSummary({ text }: { text: string }) {
  return <Text style={styles.filterSummary}>{text}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export function ReportTable({
  headers,
  rows,
  widths,
}: {
  headers: string[];
  rows: (string | number)[][];
  /** Peso de largura (flex) de cada coluna — o padrão é peso 2 na primeira coluna e 1 nas demais. */
  widths?: number[];
}) {
  const columnWidths = widths ?? headers.map((_, index) => (index === 0 ? 2 : 1));

  return (
    <View style={styles.table}>
      <View style={styles.tableHeaderRow}>
        {headers.map((header, index) => (
          <Text key={index} style={[styles.tableCellHeader, { flex: columnWidths[index] ?? 1 }]}>
            {header}
          </Text>
        ))}
      </View>
      {rows.length === 0 ? (
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Nenhum dado encontrado para os filtros aplicados.</Text>
        </View>
      ) : (
        rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.tableRow}>
            {row.map((cell, cellIndex) => (
              <Text key={cellIndex} style={[styles.tableCell, { flex: columnWidths[cellIndex] ?? 1 }]}>
                {cell}
              </Text>
            ))}
          </View>
        ))
      )}
    </View>
  );
}

export interface KpiItem {
  label: string;
  value: string;
}

export function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <View style={styles.kpiRow}>
      {items.map((item, index) => (
        <View key={index} style={styles.kpiBox}>
          <Text style={styles.kpiLabel}>{item.label}</Text>
          <Text style={styles.kpiValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function formatMinutes(value: number | null): string {
  if (value === null) return '—';
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
}

export function GeneratedAt() {
  return (
    <Text style={{ marginTop: 16, fontSize: 9, color: '#6B7280', textAlign: 'center' }}>
      Documento gerado eletronicamente em {new Date().toLocaleString('pt-BR')}.
    </Text>
  );
}

export function Letterhead({
  healthUnit,
}: {
  healthUnit: LetterheadHealthUnit | null;
}) {
  if (!healthUnit) return null;

  return (
    <View style={styles.header}>
      {healthUnit.logoUrl && (
        <Image src={healthUnit.logoUrl} style={styles.logo} />
      )}
      {healthUnit.stateName && (
        <Text style={styles.headerLine}>{healthUnit.stateName}</Text>
      )}
      <Text style={styles.headerLine}>
        {healthUnit.institutionName ?? healthUnit.name}
      </Text>
      {healthUnit.cnpj && (
        <Text style={styles.headerLine}>CNPJ: {healthUnit.cnpj}</Text>
      )}
    </View>
  );
}

export function DocumentTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function DateLine({ date }: { date: Date }) {
  return (
    <Text style={styles.dateLine}>
      {date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })}
    </Text>
  );
}

export function SignatureArea({ label }: { label: string }) {
  return (
    <View style={styles.signatureArea}>
      <View style={styles.signatureLine} />
      <Text>{label}</Text>
    </View>
  );
}

export { styles as pdfStyles };
