import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HazardCategory } from './entities/hazard-category.entity';
import { SeverityLevel } from './entities/severity-level.entity';
import { HazardReferenceSeederService } from './hazard-reference-seeder.service';
import { HazardReferencesController } from './hazard-references.controller';
import { HazardReferencesService } from './hazard-references.service';
import { HazardReportsModule } from './hazard-reports.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HazardCategory, SeverityLevel]),
    HazardReportsModule,
  ],
  controllers: [HazardReferencesController],
  providers: [HazardReferenceSeederService, HazardReferencesService],
})
export class HazardsModule {}
