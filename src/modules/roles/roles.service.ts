import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Permission, Role, RolePermission } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination/paginate.util';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';

type RoleWithPermissions = Role & { permissions: (RolePermission & { permission: Permission })[] };

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: PaginationQueryDto) {
    const { page = 1, pageSize = 10, search } = query;

    const where = {
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    return paginate<ReturnType<typeof this.toResponse>>(
      () => this.prisma.role.count({ where }),
      async (skip, take) => {
        const roles = await this.prisma.role.findMany({
          where,
          skip,
          take,
          orderBy: { name: 'asc' },
          include: { permissions: { include: { permission: true } } },
        });
        return roles.map((role) => this.toResponse(role));
      },
      page,
      pageSize,
    );
  }

  async findOne(id: string) {
    const role = await this.findRoleOrThrow(id);
    return this.toResponse(role);
  }

  async create(dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: { name: dto.name, description: dto.description },
      include: { permissions: { include: { permission: true } } },
    });
    return this.toResponse(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findRoleOrThrow(id);

    const role = await this.prisma.role.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
      include: { permissions: { include: { permission: true } } },
    });

    return this.toResponse(role);
  }

  async remove(id: string) {
    const role = await this.findRoleOrThrow(id);

    if (role.isSystem) {
      throw new BadRequestException('Perfis de sistema não podem ser removidos.');
    }

    await this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Perfil removido com sucesso.' };
  }

  async setPermissions(id: string, dto: SetRolePermissionsDto) {
    await this.findRoleOrThrow(id);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
        skipDuplicates: true,
      }),
    ]);

    const role = await this.findRoleOrThrow(id);
    return this.toResponse(role);
  }

  private async findRoleOrThrow(id: string): Promise<RoleWithPermissions> {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) {
      throw new NotFoundException('Perfil não encontrado.');
    }

    return role;
  }

  private toResponse(role: RoleWithPermissions) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((rolePermission) => ({
        id: rolePermission.permission.id,
        key: rolePermission.permission.key,
        description: rolePermission.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
