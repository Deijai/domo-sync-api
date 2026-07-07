import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTicketDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiPropertyOptional({ example: 'Compareça com 1 hora de antecedência.' })
  @IsOptional()
  @IsString()
  arrivalInstruction?: string;
}
