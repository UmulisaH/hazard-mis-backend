import { IsUUID } from 'class-validator';

export class AssignHazardReportDto {
  @IsUUID()
  assignedOfficerId!: string;
}
