import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { Institution } from './entities/institution.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  private async getInstitutionOrThrow(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({
      where: { id },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found.');
    }

    return institution;
  }

  async createInstitution(dto: CreateInstitutionDto): Promise<Institution> {
    const existingInstitution = await this.institutionRepository.findOne({
      where: { rssbCode: dto.rssbCode },
    });

    if (existingInstitution) {
      throw new ConflictException(
        'An institution with this RSSB code already exists.',
      );
    }

    return this.institutionRepository.save(
      this.institutionRepository.create(dto),
    );
  }

  async listInstitutions(): Promise<Institution[]> {
    return this.institutionRepository.find({
      relations: { departments: true },
    });
  }

  async getInstitution(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({
      where: { id },
      relations: { departments: true },
    });

    if (!institution) {
      throw new NotFoundException('Institution not found.');
    }

    return institution;
  }

  async updateInstitution(
    id: string,
    dto: UpdateInstitutionDto,
  ): Promise<Institution> {
    const institution = await this.getInstitution(id);

    if (dto.rssbCode && dto.rssbCode !== institution.rssbCode) {
      const duplicate = await this.institutionRepository.findOne({
        where: { rssbCode: dto.rssbCode },
      });

      if (duplicate) {
        throw new ConflictException(
          'An institution with this RSSB code already exists.',
        );
      }
    }

    Object.assign(institution, dto);
    return this.institutionRepository.save(institution);
  }

  async deleteInstitution(id: string): Promise<{ deleted: true }> {
    const institution = await this.getInstitution(id);
    await this.institutionRepository.remove(institution);
    return { deleted: true };
  }

  async createDepartment(dto: CreateDepartmentDto): Promise<Department> {
    const institution = await this.getInstitutionOrThrow(dto.institutionId);

    return this.departmentRepository.save(
      this.departmentRepository.create({
        name: dto.name,
        description: dto.description ?? null,
        institution,
      }),
    );
  }

  async listDepartments(): Promise<Department[]> {
    return this.departmentRepository.find({ relations: { institution: true } });
  }

  async getDepartment(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: { institution: true },
    });

    if (!department) {
      throw new NotFoundException('Department not found.');
    }

    return department;
  }

  async updateDepartment(
    id: string,
    dto: UpdateDepartmentDto,
  ): Promise<Department> {
    const department = await this.getDepartment(id);

    if (dto.institutionId) {
      department.institution = await this.getInstitutionOrThrow(
        dto.institutionId,
      );
    }

    Object.assign(department, {
      name: dto.name ?? department.name,
      description:
        dto.description !== undefined
          ? dto.description
          : department.description,
    });

    return this.departmentRepository.save(department);
  }

  async deleteDepartment(id: string): Promise<{ deleted: true }> {
    const department = await this.getDepartment(id);
    await this.departmentRepository.remove(department);
    return { deleted: true };
  }
}
