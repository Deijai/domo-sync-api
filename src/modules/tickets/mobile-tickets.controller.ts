import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { assertPrincipalType } from '../../common/utils/principal.util';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { TicketsService } from './tickets.service';
import { QueryTicketsDto } from './dto/query-tickets.dto';

@ApiTags('Tickets (Mobile)')
@ApiBearerAuth()
@Controller('mobile')
export class MobileTicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('tickets/open')
  @ApiOperation({ summary: 'Lista fichas disponíveis para reserva (paciente autenticado)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de fichas disponíveis.' })
  findOpenTickets(@CurrentUser() principal: JwtPayload, @Query() query: QueryTicketsDto) {
    assertPrincipalType(principal, 'PATIENT');
    return this.ticketsService.findOpenTicketsForMobile(query);
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Detalha uma ficha disponível' })
  @ApiResponse({ status: 200, description: 'Ficha encontrada.' })
  findTicketDetail(@CurrentUser() principal: JwtPayload, @Param('id') id: string) {
    assertPrincipalType(principal, 'PATIENT');
    return this.ticketsService.findOpenTicketDetailForMobile(id);
  }

  @Post('tickets/:id/reserve')
  @ApiOperation({ summary: 'Reserva uma ficha específica (transação segura contra dupla reserva)' })
  @ApiResponse({ status: 200, description: 'Ficha reservada com sucesso.' })
  @ApiResponse({ status: 409, description: 'Ficha já reservada por outro paciente.' })
  reserve(@CurrentUser() principal: JwtPayload, @Param('id') id: string) {
    assertPrincipalType(principal, 'PATIENT');
    return this.ticketsService.reserve(id, principal.sub);
  }

  @Post('tickets/:id/cancel-reservation')
  @ApiOperation({ summary: 'Cancela a própria reserva, liberando a ficha novamente' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada.' })
  cancelReservation(@CurrentUser() principal: JwtPayload, @Param('id') id: string) {
    assertPrincipalType(principal, 'PATIENT');
    return this.ticketsService.cancelReservation(id, principal.sub);
  }

  @Get('me/tickets')
  @ApiOperation({ summary: 'Lista as fichas ativas do paciente autenticado (reservadas/confirmadas)' })
  @ApiResponse({ status: 200, description: 'Lista paginada de fichas ativas.' })
  findMyTickets(@CurrentUser() principal: JwtPayload, @Query() query: PaginationQueryDto) {
    assertPrincipalType(principal, 'PATIENT');
    return this.ticketsService.findMyTickets(principal.sub, query);
  }

  @Get('me/tickets/history')
  @ApiOperation({ summary: 'Histórico completo de fichas do paciente autenticado' })
  @ApiResponse({ status: 200, description: 'Lista paginada do histórico.' })
  findMyHistory(@CurrentUser() principal: JwtPayload, @Query() query: PaginationQueryDto) {
    assertPrincipalType(principal, 'PATIENT');
    return this.ticketsService.findMyHistory(principal.sub, query);
  }
}
