import { Injectable, NotFoundException } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { PrismaService } from '../../prisma/prisma.service';
import { HealthUnitsService } from '../health-units/health-units.service';
import { TicketPdfDocument } from './pdf/ticket-document';
import { PatientPdfDocument } from './pdf/patient-document';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly healthUnitsService: HealthUnitsService,
  ) {}

  async ticketPdf(ticketId: string): Promise<Buffer> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, deletedAt: null },
      include: {
        specialty: true,
        professional: true,
        healthUnit: true,
        patient: true,
      },
    });
    if (!ticket) {
      throw new NotFoundException('Ficha não encontrada.');
    }

    return renderToBuffer(<TicketPdfDocument ticket={ticket} />);
  }

  async patientPdf(patientId: string): Promise<Buffer> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, deletedAt: null },
    });
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const latestTicket = await this.prisma.ticket.findFirst({
      where: { patientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { healthUnit: true },
    });

    const healthUnit =
      latestTicket?.healthUnit ?? (await this.healthUnitsService.findDefault());

    return renderToBuffer(
      <PatientPdfDocument patient={patient} healthUnit={healthUnit} />,
    );
  }
}
