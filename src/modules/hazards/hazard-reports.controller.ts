import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AssignHazardReportDto } from './dto/assign-hazard-report.dto';
import { CloseHazardReportDto } from './dto/close-hazard-report.dto';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { CreateHazardReportDto } from './dto/create-hazard-report.dto';
import { InvestigateHazardReportDto } from './dto/investigate-hazard-report.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';
import { HazardReportsService } from './hazard-reports.service';

@Controller('hazard-reports')
export class HazardReportsController {
  constructor(private readonly hazardReportsService: HazardReportsService) {}

  @UseGuards(AuthGuard)
  @Get()
  findAll(@Req() request: { user: AuthenticatedUser }) {
    return this.hazardReportsService.findHazardReportsForUser(request.user);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Req() request: { user: AuthenticatedUser },
    @Body() createHazardReportDto: CreateHazardReportDto,
  ) {
    return this.hazardReportsService.createHazardReport(
      request.user.id,
      createHazardReportDto,
    );
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('admin', 'safety_officer')
  @Patch(':id/assign')
  assignOfficer(
    @Param('id') hazardReportId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() assignHazardReportDto: AssignHazardReportDto,
  ) {
    return this.hazardReportsService.assignOfficer(
      hazardReportId,
      assignHazardReportDto,
      request.user,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':id/investigate')
  investigate(
    @Param('id') hazardReportId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() investigateHazardReportDto: InvestigateHazardReportDto,
  ) {
    return this.hazardReportsService.investigate(
      hazardReportId,
      investigateHazardReportDto,
      request.user,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':id/corrective-actions')
  addCorrectiveAction(
    @Param('id') hazardReportId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() createCorrectiveActionDto: CreateCorrectiveActionDto,
  ) {
    return this.hazardReportsService.addCorrectiveAction(
      hazardReportId,
      createCorrectiveActionDto,
      request.user,
    );
  }

  @UseGuards(AuthGuard)
  @Patch(':id/corrective-actions/:correctiveActionId')
  updateCorrectiveAction(
    @Param('id') hazardReportId: string,
    @Param('correctiveActionId') correctiveActionId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() updateCorrectiveActionDto: UpdateCorrectiveActionDto,
  ) {
    return this.hazardReportsService.updateCorrectiveAction(
      hazardReportId,
      correctiveActionId,
      updateCorrectiveActionDto,
      request.user,
    );
  }

  @UseGuards(AuthGuard)
  @Post(':id/close')
  closeReport(
    @Param('id') hazardReportId: string,
    @Req() request: { user: AuthenticatedUser },
    @Body() closeHazardReportDto: CloseHazardReportDto,
  ) {
    return this.hazardReportsService.closeReport(
      hazardReportId,
      closeHazardReportDto,
      request.user,
    );
  }
}
