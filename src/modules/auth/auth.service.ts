import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { comparePassword } from '../../common/utils/password.util';
import { hashToken } from '../../common/utils/token.util';
import { LoginDto } from './dto/login.dto';
import { PatientLoginDto } from './dto/patient-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtPayload } from './types/jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await comparePassword(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const permissions = user.role.permissions.map((rolePermission) => rolePermission.permission.key);
    const tokens = await this.issueTokens(
      { sub: user.id, type: 'USER', roleId: user.roleId, permissions },
      { userId: user.id },
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: { id: user.role.id, name: user.role.name },
      },
      type: 'USER' as const,
    };
  }

  async patientLogin(dto: PatientLoginDto) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        deletedAt: null,
        OR: [{ cpf: dto.login }, { email: dto.login }],
      },
    });

    if (!patient || patient.status !== 'ACTIVE') {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await comparePassword(dto.password, patient.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const tokens = await this.issueTokens({ sub: patient.id, type: 'PATIENT' }, { patientId: patient.id });

    return {
      ...tokens,
      user: {
        id: patient.id,
        fullName: patient.fullName,
        cpf: patient.cpf,
        email: patient.email,
        status: patient.status,
      },
      type: 'PATIENT' as const,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const tokenHash = hashToken(dto.refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    if (payload.type === 'USER') {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });

      if (!user || user.deletedAt || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Usuário inválido.');
      }

      const permissions = user.role.permissions.map((rolePermission) => rolePermission.permission.key);
      const tokens = await this.issueTokens(
        { sub: user.id, type: 'USER', roleId: user.roleId, permissions },
        { userId: user.id },
      );

      return {
        ...tokens,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
          role: { id: user.role.id, name: user.role.name },
        },
        type: 'USER' as const,
      };
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: payload.sub } });
    if (!patient || patient.deletedAt || patient.status !== 'ACTIVE') {
      throw new UnauthorizedException('Paciente inválido.');
    }

    const tokens = await this.issueTokens({ sub: patient.id, type: 'PATIENT' }, { patientId: patient.id });

    return {
      ...tokens,
      user: {
        id: patient.id,
        fullName: patient.fullName,
        cpf: patient.cpf,
        email: patient.email,
        status: patient.status,
      },
      type: 'PATIENT' as const,
    };
  }

  async logout(dto: RefreshTokenDto) {
    const tokenHash = hashToken(dto.refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: 'Logout realizado com sucesso.' };
  }

  async me(payload: JwtPayload) {
    if (payload.type === 'USER') {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado.');
      }
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: { id: user.role.id, name: user.role.name },
        type: 'USER' as const,
      };
    }

    const patient = await this.prisma.patient.findUnique({ where: { id: payload.sub } });
    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const { passwordHash: _passwordHash, ...safePatient } = patient;
    return { ...safePatient, type: 'PATIENT' as const };
  }

  private async issueTokens(
    payload: Pick<JwtPayload, 'sub' | 'type' | 'roleId' | 'permissions'>,
    owner: { userId?: string; patientId?: string },
  ) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as any,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
    });

    const decoded = this.jwtService.decode(refreshToken) as { exp: number };

    await this.prisma.refreshToken.create({
      data: {
        userId: owner.userId,
        patientId: owner.patientId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
