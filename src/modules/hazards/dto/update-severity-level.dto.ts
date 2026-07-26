import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSeverityLevelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  weight?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
