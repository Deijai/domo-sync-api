import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PERMISSIONS } from '../../common/constants/permissions.const';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'Lista perfis de acesso paginados' })
  @ApiResponse({ status: 200, description: 'Lista paginada de perfis.' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  @ApiOperation({ summary: 'Detalha um perfil de acesso e suas permissões' })
  @ApiResponse({ status: 200, description: 'Perfil encontrado.' })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_CREATE)
  @ApiOperation({ summary: 'Cria um perfil de acesso' })
  @ApiResponse({ status: 201, description: 'Perfil criado.' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  @ApiOperation({ summary: 'Atualiza um perfil de acesso' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado.' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Patch(':id/permissions')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  @ApiOperation({ summary: 'Define o conjunto exato de permissões de um perfil' })
  @ApiResponse({ status: 200, description: 'Permissões atualizadas.' })
  setPermissions(@Param('id') id: string, @Body() dto: SetRolePermissionsDto) {
    return this.rolesService.setPermissions(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ROLES_DELETE)
  @ApiOperation({ summary: 'Remove (soft delete) um perfil de acesso' })
  @ApiResponse({ status: 200, description: 'Perfil removido.' })
  @ApiResponse({ status: 400, description: 'Perfil de sistema não pode ser removido.' })
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
