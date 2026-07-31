import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import {
  HazardPriority,
  HazardReportStatus,
} from '../entities/hazard-report.entity';

export class ListHazardReportsQueryDto {
  @IsOptional()
  @IsEnum(HazardReportStatus)
  status?: HazardReportStatus;

  @IsOptional()
  @IsEnum(HazardPriority)
  aiPriority?: HazardPriority;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  hazardCategoryId?: string;

  @IsOptional()
  @IsUUID()
  severityLevelId?: string;

  @IsOptional()
  @IsUUID()
  assignedOfficerId?: string;

  @IsOptional()
  @IsUUID()
  reporterId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  toDate?: string;

}
