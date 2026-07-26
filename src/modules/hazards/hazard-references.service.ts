import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHazardCategoryDto } from './dto/create-hazard-category.dto';
import { CreateSeverityLevelDto } from './dto/create-severity-level.dto';
import { UpdateHazardCategoryDto } from './dto/update-hazard-category.dto';
import { UpdateSeverityLevelDto } from './dto/update-severity-level.dto';
import { HazardCategory } from './entities/hazard-category.entity';
import { SeverityLevel } from './entities/severity-level.entity';

@Injectable()
export class HazardReferencesService {
  constructor(
    @InjectRepository(HazardCategory)
    private readonly hazardCategoryRepository: Repository<HazardCategory>,
    @InjectRepository(SeverityLevel)
    private readonly severityLevelRepository: Repository<SeverityLevel>,
  ) {}

  async listHazardCategories(): Promise<HazardCategory[]> {
    return this.hazardCategoryRepository.find({
      relations: { parent: true },
      order: { name: 'ASC' },
    });
  }

  async getHazardCategory(id: string): Promise<HazardCategory> {
    const hazardCategory = await this.hazardCategoryRepository.findOne({
      where: { id },
      relations: { parent: true },
    });

    if (!hazardCategory) {
      throw new NotFoundException('Hazard category not found.');
    }

    return hazardCategory;
  }

  async createHazardCategory(
    dto: CreateHazardCategoryDto,
  ): Promise<HazardCategory> {
    const duplicate = await this.hazardCategoryRepository.findOne({
      where: { name: dto.name },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'A hazard category with this name already exists.',
      );
    }

    const hazardCategory = this.hazardCategoryRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      parent: null,
    });

    if (dto.parentId) {
      hazardCategory.parent = await this.getHazardCategory(dto.parentId);
    }

    return this.hazardCategoryRepository.save(hazardCategory);
  }

  async updateHazardCategory(
    id: string,
    dto: UpdateHazardCategoryDto,
  ): Promise<HazardCategory> {
    const hazardCategory = await this.getHazardCategory(id);

    if (dto.name && dto.name !== hazardCategory.name) {
      const duplicate = await this.hazardCategoryRepository.findOne({
        where: { name: dto.name },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          'A hazard category with this name already exists.',
        );
      }
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException(
          'A hazard category cannot be its own parent.',
        );
      }

      hazardCategory.parent = dto.parentId
        ? await this.getHazardCategory(dto.parentId)
        : null;
    }

    Object.assign(hazardCategory, {
      name: dto.name ?? hazardCategory.name,
      description:
        dto.description !== undefined
          ? dto.description
          : hazardCategory.description,
    });

    return this.hazardCategoryRepository.save(hazardCategory);
  }

  async deleteHazardCategory(id: string): Promise<{ deleted: true }> {
    const hazardCategory = await this.getHazardCategory(id);
    await this.hazardCategoryRepository.remove(hazardCategory);
    return { deleted: true };
  }

  async listSeverityLevels(): Promise<SeverityLevel[]> {
    return this.severityLevelRepository.find({
      order: { weight: 'ASC', name: 'ASC' },
    });
  }

  async getSeverityLevel(id: string): Promise<SeverityLevel> {
    const severityLevel = await this.severityLevelRepository.findOne({
      where: { id },
    });

    if (!severityLevel) {
      throw new NotFoundException('Severity level not found.');
    }

    return severityLevel;
  }

  async createSeverityLevel(
    dto: CreateSeverityLevelDto,
  ): Promise<SeverityLevel> {
    const duplicate = await this.severityLevelRepository.findOne({
      where: { name: dto.name },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'A severity level with this name already exists.',
      );
    }

    return this.severityLevelRepository.save(
      this.severityLevelRepository.create({
        name: dto.name,
        weight: dto.weight,
        description: dto.description ?? null,
      }),
    );
  }

  async updateSeverityLevel(
    id: string,
    dto: UpdateSeverityLevelDto,
  ): Promise<SeverityLevel> {
    const severityLevel = await this.getSeverityLevel(id);

    if (dto.name && dto.name !== severityLevel.name) {
      const duplicate = await this.severityLevelRepository.findOne({
        where: { name: dto.name },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          'A severity level with this name already exists.',
        );
      }
    }

    Object.assign(severityLevel, {
      name: dto.name ?? severityLevel.name,
      weight: dto.weight ?? severityLevel.weight,
      description:
        dto.description !== undefined
          ? dto.description
          : severityLevel.description,
    });

    return this.severityLevelRepository.save(severityLevel);
  }

  async deleteSeverityLevel(id: string): Promise<{ deleted: true }> {
    const severityLevel = await this.getSeverityLevel(id);
    await this.severityLevelRepository.remove(severityLevel);
    return { deleted: true };
  }
}
