import { IsOptional, IsString } from 'class-validator';

export class CloseHazardReportDto {
  @IsString()
  closureNotes!: string;

  @IsOptional()
  @IsString()
  effectivenessCheck?: string;
}
