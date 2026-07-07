export type PrincipalType = 'USER' | 'PATIENT';

export interface JwtPayload {
  sub: string;
  type: PrincipalType;
  roleId?: string;
  permissions?: string[];
  professionalId?: string;
}
