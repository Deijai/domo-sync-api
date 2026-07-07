import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { SimpleStatus } from '@prisma/client';

export class CreateProfessionalDto {
  @ApiProperty({ example: 'Dr. João Pereira' })
  @IsString()
  fullName!: string;

  @ApiProperty({ example: '98765432100' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'CPF deve conter 11 dígitos numéricos.' })
  cpf!: string;

  @ApiPropertyOptional({ example: 'CRM' })
  @IsOptional()
  @IsString()
  councilType?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  councilNumber?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  councilState?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ enum: SimpleStatus, default: SimpleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SimpleStatus)
  status?: SimpleStatus;
}
