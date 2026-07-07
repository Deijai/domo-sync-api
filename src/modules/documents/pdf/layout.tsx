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
});

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
