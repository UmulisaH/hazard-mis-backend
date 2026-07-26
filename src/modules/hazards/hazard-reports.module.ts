import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../institutions/entities/department.entity';
import { Employee } from '../users/entities/employee.entity';
import { AuditTrail } from './entities/audit-trail.entity';
import { ClosureRecord } from './entities/closure-record.entity';
import { CorrectiveAction } from './entities/corrective-action.entity';
import { HazardCategory } from './entities/hazard-category.entity';
import { HazardReport } from './entities/hazard-report.entity';
import { InvestigationDetail } from './entities/investigation-detail.entity';
import { SeverityLevel } from './entities/severity-level.entity';
import { HazardReportAuditService } from './hazard-report-audit.service';
import { HazardReportsController } from './hazard-reports.controller';
import { HazardReportsService } from './hazard-reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HazardReport,
      InvestigationDetail,
      CorrectiveAction,
      ClosureRecord,
      AuditTrail,
      Department,
      HazardCategory,
      SeverityLevel,
      Employee,
    ]),
  ],
  controllers: [HazardReportsController],
  providers: [HazardReportsService, HazardReportAuditService],
})
export class HazardReportsModule {}
