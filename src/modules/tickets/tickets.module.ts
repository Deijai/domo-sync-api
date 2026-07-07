import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { MobileTicketsController } from './mobile-tickets.controller';
import { PublicQueueController } from './public-queue.controller';
import { TicketsService } from './tickets.service';
import { QueueGateway } from './queue.gateway';

@Module({
  controllers: [TicketsController, MobileTicketsController, PublicQueueController],
  providers: [TicketsService, QueueGateway],
  exports: [TicketsService],
})
export class TicketsModule {}
