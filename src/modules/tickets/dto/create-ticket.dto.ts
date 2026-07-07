import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty()
  @IsUUID()
  specialtyId!: string;

  @ApiProperty()
  @IsUUID()
  professionalId!: string;

  @ApiProperty()
  @IsUUID()
  healthUnitId!: string;

  @ApiProperty({ example: '2026-07-10' })
  @IsDateString()
  serviceDate!: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @ApiPropertyOptional({ example: 'Compareça com 1 hora de antecedência.' })
  @IsOptional()
  @IsString()
  arrivalInstruction?: string;
}
