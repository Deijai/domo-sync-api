import { Document, Page, Text } from '@react-pdf/renderer';
import type { HealthUnit, Patient } from '@prisma/client';
import {
  DateLine,
  DocumentTitle,
  InfoRow,
  Letterhead,
  pdfStyles,
  SignatureArea,
} from './layout';

const GENDER_LABEL: Record<Patient['gender'], string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  OTHER: 'Outro',
  NOT_INFORMED: 'Não informado',
};

function formatAddress(patient: Patient): string {
  const parts = [
    patient.street && patient.number
      ? `${patient.street}, ${patient.number}`
      : patient.street,
    patient.complement,
    patient.neighborhood,
    patient.city && patient.state
      ? `${patient.city}/${patient.state}`
      : patient.city,
    patient.zipCode,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : 'Não informado';
}

export function PatientPdfDocument({
  patient,
  healthUnit,
}: {
  patient: Patient;
  healthUnit: HealthUnit | null;
}) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Letterhead healthUnit={healthUnit} />
        <DocumentTitle>Ficha de Cadastro do Paciente</DocumentTitle>

        <InfoRow label="Nome completo" value={patient.fullName} />
        <InfoRow label="CPF" value={patient.cpf} />
        {patient.rg && <InfoRow label="RG" value={patient.rg} />}
        <InfoRow
          label="Data de nascimento"
          value={patient.birthDate.toLocaleDateString('pt-BR')}
        />
        <InfoRow label="Sexo" value={GENDER_LABEL[patient.gender]} />
        {patient.motherName && (
          <InfoRow label="Nome da mãe" value={patient.motherName} />
        )}
        {patient.fatherName && (
          <InfoRow label="Nome do pai" value={patient.fatherName} />
        )}
        {patient.susCard && (
          <InfoRow label="Cartão SUS" value={patient.susCard} />
        )}
        {patient.phone && <InfoRow label="Telefone" value={patient.phone} />}
        {patient.whatsapp && (
          <InfoRow label="WhatsApp" value={patient.whatsapp} />
        )}
        {patient.email && <InfoRow label="E-mail" value={patient.email} />}
        <InfoRow label="Endereço" value={formatAddress(patient)} />
        {patient.referencePoint && (
          <InfoRow label="Ponto de referência" value={patient.referencePoint} />
        )}

        <DateLine date={new Date()} />

        <SignatureArea label="Assinatura do paciente / responsável" />

        <Text
          style={{
            marginTop: 4,
            fontSize: 9,
            color: '#6B7280',
            textAlign: 'center',
          }}
        >
          Documento gerado eletronicamente em{' '}
          {new Date().toLocaleString('pt-BR')}.
        </Text>
      </Page>
    </Document>
  );
}
