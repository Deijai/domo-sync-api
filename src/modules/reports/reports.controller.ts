import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports-query.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@RequirePermissions(PERMISSIONS.REPORTS_READ)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumo geral de fichas (KPIs para o dashboard)' })
  @ApiResponse({ status: 200, description: 'Resumo com totais e taxa de comparecimento.' })
  summary(@Query() query: ReportsQueryDto) {
    return this.reportsService.summary(query);
  }

  @Get('tickets-by-status')
  @ApiOperation({ summary: 'Fichas agrupadas por status' })
  @ApiResponse({ status: 200, description: 'Contagem de fichas por status.' })
  ticketsByStatus(@Query() query: ReportsQueryDto) {
    return this.reportsService.ticketsByStatus(query);
  }

  @Get('tickets-by-specialty')
  @ApiOperation({ summary: 'Fichas agrupadas por especialidade' })
  @ApiResponse({ status: 200, description: 'Contagem de fichas por especialidade.' })
  ticketsBySpecialty(@Query() query: ReportsQueryDto) {
    return this.reportsService.ticketsBySpecialty(query);
  }

  @Get('tickets-by-professional')
  @ApiOperation({ summary: 'Fichas agrupadas por profissional' })
  @ApiResponse({ status: 200, description: 'Contagem de fichas por profissional.' })
  ticketsByProfessional(@Query() query: ReportsQueryDto) {
    return this.reportsService.ticketsByProfessional(query);
  }

  @Get('tickets-by-unit')
  @ApiOperation({ summary: 'Fichas agrupadas por unidade de saúde' })
  @ApiResponse({ status: 200, description: 'Contagem de fichas por unidade.' })
  ticketsByUnit(@Query() query: ReportsQueryDto) {
    return this.reportsService.ticketsByUnit(query);
  }

  @Get('tickets-by-patient')
  @ApiOperation({ summary: 'Fichas agrupadas por paciente' })
  @ApiResponse({ status: 200, description: 'Contagem de fichas por paciente.' })
  ticketsByPatient(@Query() query: ReportsQueryDto) {
    return this.reportsService.ticketsByPatient(query);
  }

  @Get('attendance-rate')
  @ApiOperation({ summary: 'Taxa de comparecimento e de faltas' })
  @ApiResponse({ status: 200, description: 'Taxas de comparecimento/falta.' })
  attendanceRate(@Query() query: ReportsQueryDto) {
    return this.reportsService.attendanceRate(query);
  }
}
