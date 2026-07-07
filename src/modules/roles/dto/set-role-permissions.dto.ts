import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class SetRolePermissionsDto {
  @ApiProperty({ type: [String], description: 'IDs das permissões que o perfil deve ter' })
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds!: string[];
}
