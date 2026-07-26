import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HazardCategory } from './entities/hazard-category.entity';
import { SeverityLevel } from './entities/severity-level.entity';

@Injectable()
export class HazardReferenceSeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(SeverityLevel)
    private readonly severityLevelRepository: Repository<SeverityLevel>,
    @InjectRepository(HazardCategory)
    private readonly hazardCategoryRepository: Repository<HazardCategory>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedSeverityLevels();
    await this.seedHazardCategories();
  }

  private async seedSeverityLevels(): Promise<void> {
    const seedLevels = [
      {
        name: 'Low',
        weight: 1,
        description: 'Low-risk hazard requiring routine monitoring.',
      },
      {
        name: 'Medium',
        weight: 2,
        description: 'Moderate-risk hazard requiring timely action.',
      },
      {
        name: 'High',
        weight: 3,
        description: 'High-risk hazard requiring prompt mitigation.',
      },
      {
        name: 'Critical',
        weight: 4,
        description: 'Critical hazard requiring immediate intervention.',
      },
    ];

    for (const level of seedLevels) {
      const existing = await this.severityLevelRepository.findOne({
        where: { name: level.name },
      });

      if (!existing) {
        await this.severityLevelRepository.save(
          this.severityLevelRepository.create(level),
        );
      }
    }
  }

  private async seedHazardCategories(): Promise<void> {
    const seedCategories = [
      {
        name: 'Machinery',
        description: 'Hazards related to moving or powered equipment.',
      },
      {
        name: 'Chemical',
        description: 'Hazards involving chemical exposure or handling.',
      },
      {
        name: 'Electrical',
        description: 'Hazards associated with electrical systems or energy.',
      },
      {
        name: 'Ergonomic',
        description:
          'Hazards caused by repetitive strain or poor workstation design.',
      },
      {
        name: 'Slip/Trip/Fall',
        description:
          'Hazards involving slipping, tripping, or falling incidents.',
      },
      {
        name: 'Fire',
        description:
          'Hazards involving ignition, smoke, or open flame exposure.',
      },
      {
        name: 'Biological',
        description:
          'Hazards involving pathogens, bodily fluids, or biohazards.',
      },
    ];

    for (const category of seedCategories) {
      const existing = await this.hazardCategoryRepository.findOne({
        where: { name: category.name },
      });

      if (!existing) {
        await this.hazardCategoryRepository.save(
          this.hazardCategoryRepository.create(category),
        );
      }
    }
  }
}
