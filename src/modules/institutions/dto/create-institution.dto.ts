import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateInstitutionDto {
  @IsString()
  name!: string;

  @IsString()
  rssbCode!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
