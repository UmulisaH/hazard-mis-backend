import { UserRole } from '../../users/entities/employee.entity';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
