import { ForbiddenException } from '@nestjs/common';
import { JwtPayload, PrincipalType } from '../../modules/auth/types/jwt-payload.type';

export function assertPrincipalType(principal: JwtPayload, type: PrincipalType) {
  if (principal.type !== type) {
    throw new ForbiddenException(
      type === 'PATIENT' ? 'Acesso restrito a pacientes.' : 'Acesso restrito a usuários internos.',
    );
  }
}
