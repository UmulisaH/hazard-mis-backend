import { SetMetadata } from '@nestjs/common';

export type AppRole =
  | 'admin'
  | 'manager'
  | 'safety_officer'
  | 'reporter';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
