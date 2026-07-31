import { IsEnum } from 'class-validator';
import { UserRole } from '../entities/employee.entity';

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}
