import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class InvestigateHazardReportDto {
  @IsString()
  @IsNotEmpty()
  findings!: string;

  @IsString()
  @IsNotEmpty()
  rootCause!: string;

  @IsArray()
  contributingFactors!: string[];
}
