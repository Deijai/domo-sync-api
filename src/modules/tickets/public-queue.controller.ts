import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TicketsService } from './tickets.service';

@ApiTags('Public Queue Panel')
@Controller('public/queue-panel')
export class PublicQueueController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Public()
  @Get(':healthUnitId')
  @ApiOperation({ summary: 'Snapshot público da fila de chamada de uma unidade (sem dados do paciente)' })
  @ApiResponse({ status: 200, description: 'Senha atual e últimas chamadas.' })
  getPanel(@Param('healthUnitId') healthUnitId: string) {
    return this.ticketsService.getPublicPanel(healthUnitId);
  }
}
