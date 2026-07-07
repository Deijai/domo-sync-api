import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTicketDto {
  @ApiProperty({ description: 'Paciente para vincular à ficha disponível (marcar consulta)' })
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;
}
