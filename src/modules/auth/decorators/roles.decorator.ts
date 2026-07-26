import { SetMetadata } from '@nestjs/common';

export type AppRole = 'safety_officer' | 'admin';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
