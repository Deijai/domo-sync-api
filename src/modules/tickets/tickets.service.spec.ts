import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueGateway } from './queue.gateway';

function futureDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toISOString().slice(0, 10);
}

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: any;
  let tx: any;
  let queueGateway: { emitTicketCalled: jest.Mock };

  beforeEach(async () => {
    tx = {
      ticketBatch: { create: jest.fn() },
      ticket: {
        create: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
      },
      ticketMovement: { create: jest.fn() },
    };

    prisma = {
      $transaction: jest.fn((callback: any) => callback(tx)),
      specialty: { findFirst: jest.fn() },
      professional: { findFirst: jest.fn() },
      healthUnit: { findFirst: jest.fn() },
      patient: { findFirst: jest.fn() },
      ticketBatch: { findFirst: jest.fn() },
      ticket: {
        findFirst: jest.fn(),
        findFirstOrThrow: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      ticketMovement: { create: jest.fn() },
    };

    queueGateway = { emitTicketCalled: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: PrismaService, useValue: prisma },
        { provide: QueueGateway, useValue: queueGateway },
      ],
    }).compile();

    service = module.get(TicketsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createBatch', () => {
    it('cria o lote e gera as fichas AVAILABLE numeradas', async () => {
      prisma.specialty.findFirst.mockResolvedValue({ id: 'spec-1', status: 'ACTIVE' });
      prisma.professional.findFirst.mockResolvedValue({
        id: 'prof-1',
        status: 'ACTIVE',
        specialties: [{ specialtyId: 'spec-1' }],
      });
      prisma.healthUnit.findFirst.mockResolvedValue({ id: 'unit-1', status: 'ACTIVE' });

      tx.ticketBatch.create.mockResolvedValue({
        id: 'batch-1',
        arrivalInstruction: 'Compareça com 1 hora de antecedência.',
      });
      tx.ticket.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: `ticket-${data.ticketNumber}`, ...data }),
      );
      tx.ticketMovement.create.mockResolvedValue({});
      prisma.ticketBatch.findFirst.mockResolvedValue({ id: 'batch-1' });

      const result = await service.createBatch(
        {
          specialtyId: 'spec-1',
          professionalId: 'prof-1',
          healthUnitId: 'unit-1',
          serviceDate: futureDate(),
          totalTickets: 3,
        } as any,
        'admin-1',
      );

      expect(tx.ticket.create).toHaveBeenCalledTimes(3);
      expect(tx.ticketMovement.create).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ id: 'batch-1' });
    });

    it('rejeita quando o profissional não atende a especialidade informada', async () => {
      prisma.specialty.findFirst.mockResolvedValue({ id: 'spec-1', status: 'ACTIVE' });
      prisma.professional.findFirst.mockResolvedValue({ id: 'prof-1', status: 'ACTIVE', specialties: [] });
      prisma.healthUnit.findFirst.mockResolvedValue({ id: 'unit-1', status: 'ACTIVE' });

      await expect(
        service.createBatch(
          {
            specialtyId: 'spec-1',
            professionalId: 'prof-1',
            healthUnitId: 'unit-1',
            serviceDate: futureDate(),
            totalTickets: 1,
          } as any,
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reserve', () => {
    it('reserva uma ficha disponível com sucesso', async () => {
      tx.ticket.updateMany.mockResolvedValue({ count: 1 });
      tx.ticket.findUniqueOrThrow.mockResolvedValue({ id: 'ticket-1', status: 'RESERVED', patientId: 'patient-1' });

      const result = await service.reserve('ticket-1', 'patient-1');

      expect(result.status).toBe('RESERVED');
      expect(tx.ticketMovement.create).toHaveBeenCalled();
    });

    it('impede reserva duplicada retornando 409 quando a ficha já foi tomada', async () => {
      tx.ticket.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.reserve('ticket-1', 'patient-2')).rejects.toThrow(ConflictException);
    });
  });

  describe('cancel', () => {
    it('cancela uma ficha disponível registrando o motivo', async () => {
      prisma.ticket.findFirst.mockResolvedValue({ id: 'ticket-1', status: 'AVAILABLE' });
      prisma.ticket.update.mockResolvedValue({ id: 'ticket-1', status: 'CANCELED' });

      const result = await service.cancel('ticket-1', { reason: 'motivo' }, 'admin-1');

      expect(result.status).toBe('CANCELED');
      expect(prisma.ticketMovement.create).toHaveBeenCalled();
    });

    it('rejeita cancelar uma ficha já atendida', async () => {
      prisma.ticket.findFirst.mockResolvedValue({ id: 'ticket-1', status: 'ATTENDED' });

      await expect(service.cancel('ticket-1', { reason: 'motivo' }, 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('transfer', () => {
    it('cria uma nova ficha para o novo paciente e marca a original como TRANSFERRED', async () => {
      const ticket = {
        id: 'ticket-1',
        status: 'RESERVED',
        batchId: 'batch-1',
        specialtyId: 'spec-1',
        professionalId: 'prof-1',
        healthUnitId: 'unit-1',
        patientId: 'patient-1',
        serviceDate: new Date(futureDate()),
        scheduledTime: '08:00',
        arrivalInstruction: 'x',
      };
      prisma.ticket.findFirst.mockResolvedValue(ticket);
      tx.ticket.aggregate.mockResolvedValue({ _max: { ticketNumber: 5 } });
      tx.ticket.create.mockResolvedValue({ id: 'ticket-new', status: 'RESERVED' });
      tx.ticket.update.mockResolvedValue({});
      tx.ticketMovement.create.mockResolvedValue({});

      const result = await service.transfer('ticket-1', { newPatientId: 'patient-2' } as any, 'admin-1');

      expect(result).toEqual({ id: 'ticket-new', status: 'RESERVED' });
      expect(tx.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ticket-1' },
          data: expect.objectContaining({ status: 'TRANSFERRED' }),
        }),
      );
    });

    it('exige ao menos um destino de transferência', async () => {
      await expect(service.transfer('ticket-1', {} as any, 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignPatient', () => {
    it('marca consulta vinculando uma ficha disponível ao paciente informado', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      tx.ticket.updateMany.mockResolvedValue({ count: 1 });
      tx.ticket.findUniqueOrThrow.mockResolvedValue({ id: 'ticket-1', status: 'RESERVED', patientId: 'patient-1' });

      const result = await service.assignPatient('ticket-1', 'patient-1', 'admin-1');

      expect(result.status).toBe('RESERVED');
      expect(tx.ticketMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ action: 'RESERVED', performedByUserId: 'admin-1' }) }),
      );
    });

    it('rejeita paciente inexistente', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.assignPatient('ticket-1', 'patient-x', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('retorna 409 quando a ficha não está mais disponível', async () => {
      prisma.patient.findFirst.mockResolvedValue({ id: 'patient-1' });
      tx.ticket.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.assignPatient('ticket-1', 'patient-1', 'admin-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('callTicket', () => {
    it('chama uma ficha confirmada para um guichê e emite evento no gateway', async () => {
      prisma.ticket.findFirst.mockResolvedValue({ id: 'ticket-1', status: 'CONFIRMED', healthUnitId: 'unit-1' });
      prisma.ticket.update.mockResolvedValue({
        id: 'ticket-1',
        status: 'CALLED',
        healthUnitId: 'unit-1',
        counterLabel: '0001',
        calledAt: new Date(),
        ticketNumber: 3,
        specialty: { code: 'P' },
      });

      const result = await service.callTicket('ticket-1', '0001', 'admin-1');

      expect(result.status).toBe('CALLED');
      expect(queueGateway.emitTicketCalled).toHaveBeenCalledWith(
        'unit-1',
        expect.objectContaining({ ticketNumber: 'P003', counterLabel: '0001' }),
      );
    });

    it('rejeita chamar uma ficha que não está confirmada nem chamada', async () => {
      prisma.ticket.findFirst.mockResolvedValue({ id: 'ticket-1', status: 'RESERVED' });

      await expect(service.callTicket('ticket-1', '0001', 'admin-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('attend', () => {
    it('permite marcar atendimento a partir de CALLED', async () => {
      prisma.ticket.findFirst.mockResolvedValue({ id: 'ticket-1', status: 'CALLED' });
      prisma.ticket.update.mockResolvedValue({ id: 'ticket-1', status: 'ATTENDED' });

      const result = await service.attend('ticket-1', 'admin-1');

      expect(result.status).toBe('ATTENDED');
      expect(prisma.ticketMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ fromStatus: 'CALLED', toStatus: 'ATTENDED' }) }),
      );
    });
  });
});
