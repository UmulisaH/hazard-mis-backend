import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { UsersService } from './users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'safety_officer')
  @Get()
  async findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAllSafeUsers(query.isSafetyOfficer);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  async me(@Req() request: { user: AuthenticatedUser }) {
    return this.usersService.findProfileById(request.user.id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/roles')
  async updateRoles(
    @Param('id') employeeId: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(employeeId, updateUserRoleDto);
  }
}
