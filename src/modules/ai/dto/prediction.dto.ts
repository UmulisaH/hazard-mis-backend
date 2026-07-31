import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class PredictionRequestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn([
    'Machinery',
    'Chemical',
    'Electrical',
    'Ergonomic',
    'Slip/Trip/Fall',
    'Fire',
    'Biological',
  ])
  hazardCategory!: string;

  @IsString()
  @IsIn(['Low', 'Medium', 'High', 'Critical'])
  severityLevel!: string;

  @IsNumber()
  @Min(0)
  @Max(20)
  recurrenceCount!: number;

  @IsBoolean()
  isWeekend!: boolean;
}

export class PredictionResponseDto {
  priority!: 'High' | 'Medium' | 'Low';
  confidence!: number;
  modelVersion!: string;
}
