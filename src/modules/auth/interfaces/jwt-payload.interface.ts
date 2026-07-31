import { UserRole } from '../../users/entities/employee.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}
