import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { HazardPriority } from '../entities/hazard-report.entity';

export class CreateHazardReportDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsUUID()
  hazardCategoryId!: string;

  @IsUUID()
  severityLevelId!: string;

  @IsOptional()
  @IsEnum(HazardPriority)
  aiPriority?: HazardPriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  aiConfidence?: number;
}
