import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ChangeDateTicketDto {
  @ApiProperty({ example: '2026-07-15' })
  @IsDateString()
  newServiceDate!: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  newScheduledTime?: string;
}
