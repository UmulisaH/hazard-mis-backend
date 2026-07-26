import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCorrectiveActionDto {
  @IsString()
  actionDescription!: string;

  @IsString()
  responsiblePerson!: string;

  @IsDateString()
  dueDate!: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
