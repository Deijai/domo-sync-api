import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SimpleStatus } from '@prisma/client';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'DERM' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'Dermatologia' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: SimpleStatus, default: SimpleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SimpleStatus)
  status?: SimpleStatus;
}
