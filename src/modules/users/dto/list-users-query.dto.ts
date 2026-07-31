import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../entities/employee.entity';

export class ListUsersQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
