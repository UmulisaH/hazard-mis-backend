import { IsEnum } from 'class-validator';
import { HazardReportStatus } from '../entities/hazard-report.entity';

export class UpdateHazardReportStatusDto {
  @IsEnum(HazardReportStatus)
  status!: HazardReportStatus;
}
