import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('tickets/:id/print')
  @RequirePermissions(PERMISSIONS.TICKETS_PRINT)
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({
    summary: 'Gera o PDF de comprovante da ficha para impressão',
  })
  @ApiResponse({ status: 200, description: 'PDF da ficha.' })
  @ApiResponse({ status: 404, description: 'Ficha não encontrada.' })
  async printTicket(@Param('id') id: string): Promise<StreamableFile> {
    const buffer = await this.documentsService.ticketPdf(id);
    return new StreamableFile(buffer, {
      disposition: `inline; filename="ficha-${id}.pdf"`,
    });
  }

  @Get('patients/:id/print')
  @RequirePermissions(PERMISSIONS.PATIENTS_PRINT)
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({
    summary: 'Gera o PDF de cadastro do paciente para impressão',
  })
  @ApiResponse({ status: 200, description: 'PDF do cadastro do paciente.' })
  @ApiResponse({ status: 404, description: 'Paciente não encontrado.' })
  async printPatient(@Param('id') id: string): Promise<StreamableFile> {
    const buffer = await this.documentsService.patientPdf(id);
    return new StreamableFile(buffer, {
      disposition: `inline; filename="paciente-${id}.pdf"`,
    });
  }
}
