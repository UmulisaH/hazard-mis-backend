import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateHazardCategoryDto } from './dto/create-hazard-category.dto';
import { CreateSeverityLevelDto } from './dto/create-severity-level.dto';
import { UpdateHazardCategoryDto } from './dto/update-hazard-category.dto';
import { UpdateSeverityLevelDto } from './dto/update-severity-level.dto';
import { HazardReferencesService } from './hazard-references.service';

@Controller()
export class HazardReferencesController {
  constructor(
    private readonly hazardReferencesService: HazardReferencesService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('hazard-categories')
  listHazardCategories() {
    return this.hazardReferencesService.listHazardCategories();
  }

  @UseGuards(AuthGuard)
  @Get('hazard-categories/:id')
  getHazardCategory(@Param('id') id: string) {
    return this.hazardReferencesService.getHazardCategory(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post('hazard-categories')
  createHazardCategory(@Body() dto: CreateHazardCategoryDto) {
    return this.hazardReferencesService.createHazardCategory(dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('hazard-categories/:id')
  updateHazardCategory(
    @Param('id') id: string,
    @Body() dto: UpdateHazardCategoryDto,
  ) {
    return this.hazardReferencesService.updateHazardCategory(id, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('hazard-categories/:id')
  deleteHazardCategory(@Param('id') id: string) {
    return this.hazardReferencesService.deleteHazardCategory(id);
  }

  @UseGuards(AuthGuard)
  @Get('severity-levels')
  listSeverityLevels() {
    return this.hazardReferencesService.listSeverityLevels();
  }

  @UseGuards(AuthGuard)
  @Get('severity-levels/:id')
  getSeverityLevel(@Param('id') id: string) {
    return this.hazardReferencesService.getSeverityLevel(id);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Post('severity-levels')
  createSeverityLevel(@Body() dto: CreateSeverityLevelDto) {
    return this.hazardReferencesService.createSeverityLevel(dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Patch('severity-levels/:id')
  updateSeverityLevel(
    @Param('id') id: string,
    @Body() dto: UpdateSeverityLevelDto,
  ) {
    return this.hazardReferencesService.updateSeverityLevel(id, dto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('severity-levels/:id')
  deleteSeverityLevel(@Param('id') id: string) {
    return this.hazardReferencesService.deleteSeverityLevel(id);
  }
}
