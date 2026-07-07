import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountStatus, Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/pagination/paginate.util';
import { hashPassword } from '../../common/utils/password.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

type UserWithRole = User & { role: Role };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryUsersDto) {
    const { page = 1, pageSize = 10, search, status, roleId, orderBy = 'createdAt', orderDirection = 'desc' } = query;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(status ? { status: status as AccountStatus } : {}),
      ...(roleId ? { roleId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return paginate<ReturnType<typeof this.toResponse>>(
      () => this.prisma.user.count({ where }),
      async (skip, take) => {
        const users = await this.prisma.user.findMany({
          where,
          skip,
          take,
          orderBy: { [orderBy]: orderDirection },
          include: { role: true },
        });
        return users.map((user) => this.toResponse(user));
      },
      page,
      pageSize,
    );
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.toResponse(user);
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        roleId: dto.roleId,
        status: dto.status,
      },
      include: { role: true },
    });

    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        roleId: dto.roleId,
        status: dto.status,
        ...(dto.password ? { passwordHash: await hashPassword(dto.password) } : {}),
      },
      include: { role: true },
    });

    return this.toResponse(user);
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Usuário removido com sucesso.' };
  }

  private toResponse(user: UserWithRole) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: { id: user.role.id, name: user.role.name },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
