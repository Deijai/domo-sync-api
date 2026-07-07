import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por ID do perfil (Role)' })
  @IsOptional()
  @IsUUID()
  roleId?: string;
}
