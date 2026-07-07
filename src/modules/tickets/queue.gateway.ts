import { Injectable } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

export type QueueTicketCalledEvent = {
  ticketId: string;
  ticketNumber: string;
  counterLabel: string;
  calledAt: Date;
  professionalName: string;
  batchLabel: string | null;
};

@Injectable()
@WebSocketGateway({ namespace: '/queue', cors: { origin: true } })
export class QueueGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const healthUnitId = client.handshake.query.healthUnitId;
    if (typeof healthUnitId === 'string' && healthUnitId) {
      client.join(this.roomName(healthUnitId));
    }
  }

  emitTicketCalled(healthUnitId: string, payload: QueueTicketCalledEvent) {
    this.server?.to(this.roomName(healthUnitId)).emit('ticket.called', payload);
  }

  private roomName(healthUnitId: string) {
    return `unit:${healthUnitId}`;
  }
}
