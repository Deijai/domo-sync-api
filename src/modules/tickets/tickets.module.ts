import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { MobileTicketsController } from './mobile-tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController, MobileTicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
