import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelTicketDto {
  @ApiProperty({ example: 'Paciente desistiu do atendimento.' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
