import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class TransferTicketDto {
  @ApiPropertyOptional({ description: 'Novo paciente para a ficha' })
  @IsOptional()
  @IsUUID()
  newPatientId?: string;

  @ApiPropertyOptional({ description: 'Novo profissional (compatível com a especialidade)' })
  @IsOptional()
  @IsUUID()
  newProfessionalId?: string;

  @ApiPropertyOptional({ example: '2026-07-15' })
  @IsOptional()
  @IsDateString()
  newServiceDate?: string;

  @ApiPropertyOptional({ example: 'Paciente solicitou outra data.' })
  @IsOptional()
  @IsString()
  reason?: string;
}
