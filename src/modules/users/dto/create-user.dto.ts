import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { AccountStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Maria Secretária' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'maria@poupafiladma.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ description: 'ID do perfil (Role)' })
  @IsUUID()
  roleId!: string;

  @ApiPropertyOptional({ enum: AccountStatus, default: AccountStatus.ACTIVE })
  @IsOptional()
  @IsEnum(AccountStatus)
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Profissional vinculado a este login (no máximo 1 login por profissional)' })
  @IsOptional()
  @IsUUID()
  professionalId?: string;
}
