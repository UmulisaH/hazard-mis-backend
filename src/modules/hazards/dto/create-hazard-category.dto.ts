import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateHazardCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
