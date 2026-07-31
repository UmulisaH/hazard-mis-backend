import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterEmployeeDto } from '../users/dto/register-employee.dto';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerEmployeeDto: RegisterEmployeeDto) {
    const passwordHash = await bcrypt.hash(registerEmployeeDto.password, 10);
    const employee = await this.usersService.createEmployee(
      registerEmployeeDto,
      passwordHash,
    );

    return {
      access_token: await this.signToken(
        employee.id,
        employee.email,
        employee.role,
      ),
      employee,
    };
  }

  async login(loginDto: LoginDto) {
    const employee = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!employee) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      employee.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const employeeProfile = await this.usersService.findProfileById(
      employee.id,
    );

    if (!employeeProfile) {
      throw new UnauthorizedException(
        'Authenticated employee profile not found.',
      );
    }

    return {
      access_token: await this.signToken(
        employee.id,
        employee.email,
        employee.role,
      ),
      employee: employeeProfile,
    };
  }

  private async signToken(
    employeeId: string,
    email: string,
    role: import('../users/entities/employee.entity').UserRole,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: employeeId,
      email,
      role,
    };

    return this.jwtService.signAsync(payload);
  }
}
