import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'SECRETARIA' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Equipe da secretaria da unidade.' })
  @IsOptional()
  @IsString()
  description?: string;
}
