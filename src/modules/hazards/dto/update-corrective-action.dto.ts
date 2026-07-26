import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateCorrectiveActionDto {
  @IsOptional()
  @IsString()
  actionDescription?: string;

  @IsOptional()
  @IsString()
  responsiblePerson?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
