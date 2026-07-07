import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTicketBatchDto {
  @ApiPropertyOptional({ example: 'Mutirão de Dermatologia — julho' })
  @IsOptional()
  @IsString()
  description?: string;

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

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  totalTickets!: number;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: 'Compareça com 1 hora de antecedência.' })
  @IsOptional()
  @IsString()
  arrivalInstruction?: string;
}
