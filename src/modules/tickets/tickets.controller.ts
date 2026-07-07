import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { TicketsService } from './tickets.service';
import { CreateTicketBatchDto } from './dto/create-ticket-batch.dto';
import { QueryTicketBatchesDto } from './dto/query-ticket-batches.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { CancelTicketDto } from './dto/cancel-ticket.dto';
import { TransferTicketDto } from './dto/transfer-ticket.dto';
import { ChangeDateTicketDto } from './dto/change-date-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { CallTicketDto } from './dto/call-ticket.dto';
import { CallNextTicketDto } from './dto/call-next-ticket.dto';
import { QueueQueryDto } from './dto/queue-query.dto';

@ApiTags('Tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('batches')
  @RequirePermissions(PERMISSIONS.TICKETS_CREATE)
  @ApiOperation({ summary: 'Cria um lote de fichas (gera as fichas numeradas automaticamente)' })
  @ApiResponse({ status: 201, description: 'Lote e fichas criados.' })
  createBatch(@Body() dto: CreateTicketBatchDto, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.createBatch(dto, principal.sub);
  }

  @Get('batches')
  @RequirePermissions(PERMISSIONS.TICKETS_READ)
  @ApiOperation({ summary: 'Lista lotes de fichas paginados' })
  @ApiResponse({ status: 200, description: 'Lista paginada de lotes.' })
  findAllBatches(@Query() query: QueryTicketBatchesDto) {
    return this.ticketsService.findAllBatches(query);
  }

  @Get('batches/:id')
  @RequirePermissions(PERMISSIONS.TICKETS_READ)
  @ApiOperation({ summary: 'Detalha um lote de fichas com a contagem por status' })
  @ApiResponse({ status: 200, description: 'Lote encontrado.' })
  findBatchDetail(@Param('id') id: string) {
    return this.ticketsService.findBatchDetail(id);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.TICKETS_READ)
  @ApiOperation({ summary: 'Lista fichas paginadas com filtros' })
  @ApiResponse({ status: 200, description: 'Lista paginada de fichas.' })
  findAllTickets(@Query() query: QueryTicketsDto) {
    return this.ticketsService.findAllTickets(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.TICKETS_CREATE)
  @ApiOperation({ summary: 'Cria uma ficha individual (fora de um lote)' })
  @ApiResponse({ status: 201, description: 'Ficha criada.' })
  createTicket(@Body() dto: CreateTicketDto, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.createTicket(dto, principal.sub);
  }

  @Get('queue')
  @RequirePermissions(PERMISSIONS.TICKETS_READ)
  @ApiOperation({ summary: 'Fila de atendimento da unidade (fichas confirmadas aguardando, chamadas e histórico recente)' })
  @ApiResponse({ status: 200, description: 'Estado atual da fila.' })
  getQueue(@Query() query: QueueQueryDto) {
    return this.ticketsService.getQueue(query.healthUnitId);
  }

  @Post('queue/call-next')
  @RequirePermissions(PERMISSIONS.TICKETS_CALL)
  @ApiOperation({ summary: 'Chama a próxima ficha confirmada da fila da unidade' })
  @ApiResponse({ status: 200, description: 'Ficha chamada.' })
  @ApiResponse({ status: 404, description: 'Não há fichas confirmadas aguardando.' })
  callNext(@Body() dto: CallNextTicketDto, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.callNext(dto.healthUnitId, dto.counterLabel, principal.sub);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.TICKETS_READ)
  @ApiOperation({ summary: 'Detalha uma ficha' })
  @ApiResponse({ status: 200, description: 'Ficha encontrada.' })
  @ApiResponse({ status: 404, description: 'Ficha não encontrada.' })
  findTicketDetail(@Param('id') id: string) {
    return this.ticketsService.findTicketDetail(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.TICKETS_UPDATE)
  @ApiOperation({ summary: 'Atualiza campos não críticos de uma ficha (horário/instrução)' })
  @ApiResponse({ status: 200, description: 'Ficha atualizada.' })
  updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.updateTicket(id, dto);
  }

  @Get(':id/movements')
  @RequirePermissions(PERMISSIONS.TICKETS_READ)
  @ApiOperation({ summary: 'Histórico de movimentações de uma ficha' })
  @ApiResponse({ status: 200, description: 'Lista paginada de movimentações.' })
  findMovements(@Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.ticketsService.findMovements(id, query);
  }

  @Post(':id/assign')
  @RequirePermissions(PERMISSIONS.TICKETS_RESERVE)
  @ApiOperation({ summary: 'Marca consulta: vincula uma ficha disponível a um paciente (AVAILABLE -> RESERVED)' })
  @ApiResponse({ status: 200, description: 'Ficha vinculada ao paciente.' })
  @ApiResponse({ status: 409, description: 'Ficha não está mais disponível.' })
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.assignPatient(id, dto.patientId, principal.sub);
  }

  @Post(':id/call')
  @RequirePermissions(PERMISSIONS.TICKETS_CALL)
  @ApiOperation({ summary: 'Chama a ficha para um guichê (CONFIRMED -> CALLED, ou rechama/troca guichê)' })
  @ApiResponse({ status: 200, description: 'Ficha chamada.' })
  call(@Param('id') id: string, @Body() dto: CallTicketDto, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.callTicket(id, dto.counterLabel, principal.sub);
  }

  @Post(':id/cancel')
  @RequirePermissions(PERMISSIONS.TICKETS_CANCEL)
  @ApiOperation({ summary: 'Cancela uma ficha disponível ou reservada' })
  @ApiResponse({ status: 200, description: 'Ficha cancelada.' })
  @ApiResponse({ status: 400, description: 'Ficha não pode ser cancelada neste status.' })
  cancel(@Param('id') id: string, @Body() dto: CancelTicketDto, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.cancel(id, dto, principal.sub);
  }

  @Post(':id/transfer')
  @RequirePermissions(PERMISSIONS.TICKETS_TRANSFER)
  @ApiOperation({ summary: 'Transfere a ficha para outro paciente, profissional ou data' })
  @ApiResponse({ status: 200, description: 'Nova ficha criada a partir da transferência.' })
  transfer(@Param('id') id: string, @Body() dto: TransferTicketDto, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.transfer(id, dto, principal.sub);
  }

  @Post(':id/change-date')
  @RequirePermissions(PERMISSIONS.TICKETS_CHANGE_DATE)
  @ApiOperation({ summary: 'Altera a data/horário de uma ficha' })
  @ApiResponse({ status: 200, description: 'Data alterada.' })
  changeDate(@Param('id') id: string, @Body() dto: ChangeDateTicketDto, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.changeDate(id, dto, principal.sub);
  }

  @Post(':id/confirm-presence')
  @RequirePermissions(PERMISSIONS.TICKETS_CONFIRM_PRESENCE)
  @ApiOperation({ summary: 'Confirma a presença do paciente (RESERVED -> CONFIRMED)' })
  @ApiResponse({ status: 200, description: 'Presença confirmada.' })
  confirmPresence(@Param('id') id: string, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.confirmPresence(id, principal.sub);
  }

  @Post(':id/attend')
  @RequirePermissions(PERMISSIONS.TICKETS_ATTEND)
  @ApiOperation({ summary: 'Marca o atendimento como realizado (CONFIRMED -> ATTENDED)' })
  @ApiResponse({ status: 200, description: 'Atendimento marcado.' })
  attend(@Param('id') id: string, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.attend(id, principal.sub);
  }

  @Post(':id/no-show')
  @RequirePermissions(PERMISSIONS.TICKETS_NO_SHOW)
  @ApiOperation({ summary: 'Marca falta do paciente' })
  @ApiResponse({ status: 200, description: 'Falta registrada.' })
  noShow(@Param('id') id: string, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.noShow(id, principal.sub);
  }

  @Post(':id/reopen')
  @RequirePermissions(PERMISSIONS.TICKETS_REOPEN)
  @ApiOperation({ summary: 'Reabre uma ficha cancelada (volta a AVAILABLE)' })
  @ApiResponse({ status: 200, description: 'Ficha reaberta.' })
  reopen(@Param('id') id: string, @CurrentUser() principal: JwtPayload) {
    return this.ticketsService.reopen(id, principal.sub);
  }
}
