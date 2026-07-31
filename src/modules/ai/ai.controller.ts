import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AiService } from './ai.service';
import {
  PredictionRequestDto,
  PredictionResponseDto,
} from './dto/prediction.dto';

@Controller('ai')
@UseGuards(AuthGuard, RolesGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  getStatus() {
    return this.aiService.getModelStatus();
  }

  @Post('predict')
  @Roles('manager', 'safety_officer')
  predict(@Body() request: PredictionRequestDto): PredictionResponseDto {
    const result = this.aiService.predictPriority(
      request.hazardCategory,
      request.severityLevel,
      request.recurrenceCount,
      request.isWeekend,
      request.title,
      request.description,
    );

    return {
      ...result,
      modelVersion: this.aiService.getModelStatus().version ?? 'v2.0',
    };
  }

  @Post('retrain')
  @Roles('admin')
  async retrainModel() {
    await this.aiService.retrainModel();

    return {
      message: '✅ Model retrained successfully!',
      status: this.aiService.getModelStatus(),
    };
  }
}
