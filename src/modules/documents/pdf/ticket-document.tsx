import { Document, Page, Text, View } from '@react-pdf/renderer';
import type {
  HealthUnit,
  Patient,
  Professional,
  Specialty,
  Ticket,
} from '@prisma/client';
import {
  DateLine,
  DocumentTitle,
  InfoRow,
  Letterhead,
  pdfStyles,
  SignatureArea,
} from './layout';

export type TicketForPdf = Ticket & {
  specialty: Specialty;
  professional: Professional;
  healthUnit: HealthUnit;
  patient: Patient | null;
};

export function TicketPdfDocument({ ticket }: { ticket: TicketForPdf }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Letterhead healthUnit={ticket.healthUnit} />
        <DocumentTitle>Comprovante de Ficha de Atendimento</DocumentTitle>

        <View>
          <InfoRow label="Ficha nº" value={String(ticket.ticketNumber)} />
          <InfoRow label="Especialidade" value={ticket.specialty.name} />
          <InfoRow label="Profissional" value={ticket.professional.fullName} />
          <InfoRow label="Unidade" value={ticket.healthUnit.name} />
          <InfoRow
            label="Paciente"
            value={ticket.patient?.fullName ?? 'Não reservada'}
          />
          {ticket.patient?.cpf && (
            <InfoRow label="CPF" value={ticket.patient.cpf} />
          )}
          <InfoRow
            label="Data do atendimento"
            value={ticket.serviceDate.toLocaleDateString('pt-BR')}
          />
          <InfoRow
            label="Horário"
            value={ticket.scheduledTime ?? 'A definir'}
          />
          <InfoRow label="Instrução" value={ticket.arrivalInstruction} />
        </View>

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
