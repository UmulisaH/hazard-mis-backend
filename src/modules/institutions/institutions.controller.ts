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
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { InstitutionsService } from './institutions.service';

@Controller()
@UseGuards(AuthGuard)
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post('institutions')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  createInstitution(@Body() dto: CreateInstitutionDto) {
    return this.institutionsService.createInstitution(dto);
  }

  @Get('institutions')
  listInstitutions() {
    return this.institutionsService.listInstitutions();
  }

  @Get('institutions/:id')
  getInstitution(@Param('id') id: string) {
    return this.institutionsService.getInstitution(id);
  }

  @Patch('institutions/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  updateInstitution(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
  ) {
    return this.institutionsService.updateInstitution(id, dto);
  }

  @Delete('institutions/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  deleteInstitution(@Param('id') id: string) {
    return this.institutionsService.deleteInstitution(id);
  }

  @Post('departments')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  createDepartment(@Body() dto: CreateDepartmentDto) {
    return this.institutionsService.createDepartment(dto);
  }

  @Get('departments')
  listDepartments() {
    return this.institutionsService.listDepartments();
  }

  @Get('departments/:id')
  getDepartment(@Param('id') id: string) {
    return this.institutionsService.getDepartment(id);
  }

  @Patch('departments/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.institutionsService.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin')
  deleteDepartment(@Param('id') id: string) {
    return this.institutionsService.deleteDepartment(id);
  }
}
