import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../institutions/entities/department.entity';
import { Employee } from './entities/employee.entity';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

export type SafeUserListItem = {
  id: string;
  fullName: string;
  jobTitle: string;
  isAdmin: boolean;
  isSafetyOfficer: boolean;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async createEmployee(
    registerEmployeeDto: RegisterEmployeeDto,
    passwordHash: string,
  ): Promise<Employee> {
    const existingEmployee = await this.employeeRepository.findOne({
      where: { email: registerEmployeeDto.email },
      select: { id: true },
    });

    if (existingEmployee) {
      throw new ConflictException(
        'An employee with this email already exists.',
      );
    }

    const department = await this.departmentRepository.findOne({
      where: { id: registerEmployeeDto.departmentId },
      relations: { institution: true },
    });

    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    if (
      !department.institution ||
      department.institution.id !== registerEmployeeDto.institutionId
    ) {
      throw new BadRequestException(
        'The selected department does not belong to the selected institution.',
      );
    }

    const employee = this.employeeRepository.create({
      email: registerEmployeeDto.email,
      passwordHash,
      fullName: registerEmployeeDto.fullName,
      jobTitle: registerEmployeeDto.jobTitle,
      phone: registerEmployeeDto.phone,
      department,
    });

    const savedEmployee = await this.employeeRepository.save(employee);
    const employeeProfile = await this.findProfileById(savedEmployee.id);

    if (!employeeProfile) {
      throw new NotFoundException('Employee profile could not be loaded.');
    }

    return employeeProfile;
  }

  async findByEmailWithPassword(email: string): Promise<Employee | null> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .addSelect('employee.passwordHash')
      .where('employee.email = :email', { email })
      .getOne();
  }

  async findProfileById(employeeId: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: { department: true },
    });
  }

  async findAllSafeUsers(
    isSafetyOfficer?: boolean,
  ): Promise<SafeUserListItem[]> {
    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .select([
        'employee.id AS "id"',
        'employee.fullName AS "fullName"',
        'employee.jobTitle AS "jobTitle"',
        'employee.isAdmin AS "isAdmin"',
        'employee.isSafetyOfficer AS "isSafetyOfficer"',
      ])
      .orderBy('employee.fullName', 'ASC');

    if (isSafetyOfficer === true) {
      queryBuilder
        .andWhere('employee.isSafetyOfficer = :isSafetyOfficer', {
          isSafetyOfficer: true,
        })
        .andWhere('employee.isAdmin = :isAdmin', {
          isAdmin: false,
        });
    }

    return queryBuilder.getRawMany<SafeUserListItem>();
  }

  async updateUserRole(
    employeeId: string,
    updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId },
      relations: { department: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    employee.isAdmin = updateUserRoleDto.isAdmin;

    if (updateUserRoleDto.isAdmin) {
      employee.isSafetyOfficer = false;
    }

    const savedEmployee = await this.employeeRepository.save(employee);
    const employeeProfile = await this.findProfileById(savedEmployee.id);

    if (!employeeProfile) {
      throw new NotFoundException('Employee profile could not be loaded.');
    }

    return employeeProfile;
  }
}
