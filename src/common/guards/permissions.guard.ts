import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { PermissionKey } from '../constants/permissions.const';
import { JwtPayload } from '../../modules/auth/types/jwt-payload.type';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<PermissionKey[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as JwtPayload | undefined;

    if (!user || user.type !== 'USER') {
      throw new ForbiddenException('Acesso restrito a usuários internos.');
    }

    const granted = new Set(user.permissions ?? []);
    const hasAll = required.every((permission) => granted.has(permission));

    if (!hasAll) {
      throw new ForbiddenException('Você não tem permissão para executar esta ação.');
    }

    return true;
  }
}
