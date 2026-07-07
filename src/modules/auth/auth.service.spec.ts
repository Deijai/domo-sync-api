import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as passwordUtil from '../../common/utils/password.util';

jest.mock('../../common/utils/password.util');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock };
    refreshToken: { create: jest.Mock };
  };
  let jwtService: { signAsync: jest.Mock; decode: jest.Mock; verifyAsync: jest.Mock };

  const mockUser = {
    id: 'user-1',
    name: 'Admin',
    email: 'admin@test.local',
    passwordHash: 'hashed',
    status: 'ACTIVE',
    deletedAt: null,
    roleId: 'role-1',
    role: {
      id: 'role-1',
      name: 'ADMIN',
      permissions: [{ permission: { key: 'users.read' } }],
    },
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      refreshToken: { create: jest.fn() },
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
      verifyAsync: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  it('faz login com credenciais válidas e emite tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(true);

    const result = await service.login({ email: mockUser.email, password: 'correct' });

    expect(result.type).toBe('USER');
    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe(mockUser.email);
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('rejeita login com senha inválida', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    (passwordUtil.comparePassword as jest.Mock).mockResolvedValue(false);

    await expect(service.login({ email: mockUser.email, password: 'wrong' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejeita login de usuário inexistente', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nobody@test.local', password: 'x' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
