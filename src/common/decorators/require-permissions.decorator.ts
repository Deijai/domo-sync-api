import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../constants/permissions.const';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
