import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateSeverityLevelDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  weight!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
