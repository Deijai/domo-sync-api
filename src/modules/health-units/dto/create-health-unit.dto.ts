import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { SimpleStatus } from '@prisma/client';

export class CreateHealthUnitDto {
  @ApiProperty({ example: 'UBS Centro' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'UBS-CENTRO' })
  @IsString()
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({ enum: SimpleStatus, default: SimpleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(SimpleStatus)
  status?: SimpleStatus;

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({
    description: 'URL do logo usado no timbrado dos documentos impressos.',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description:
      'Nome da instituição exibido no timbrado (ex.: Prefeitura Municipal de...).',
  })
  @IsOptional()
  @IsString()
  institutionName?: string;

  @ApiPropertyOptional({
    description:
      'Nome do estado exibido no timbrado (ex.: Estado de São Paulo).',
  })
  @IsOptional()
  @IsString()
  stateName?: string;

  @ApiPropertyOptional({
    description:
      'Marca esta unidade como padrão para timbrado quando não há ficha associada.',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
