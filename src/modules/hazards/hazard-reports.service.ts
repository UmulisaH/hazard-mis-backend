import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  IsNull,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Employee } from '../users/entities/employee.entity';
import { AiService } from '../ai/ai.service';
import { AssignHazardReportDto } from './dto/assign-hazard-report.dto';
import { CloseHazardReportDto } from './dto/close-hazard-report.dto';
import { CreateCorrectiveActionDto } from './dto/create-corrective-action.dto';
import { CreateHazardReportDto } from './dto/create-hazard-report.dto';
import { InvestigateHazardReportDto } from './dto/investigate-hazard-report.dto';
import { UpdateCorrectiveActionDto } from './dto/update-corrective-action.dto';
import { UpdateHazardReportStatusDto } from './dto/update-hazard-report-status.dto';
import { ListHazardReportsQueryDto } from './dto/list-hazard-reports-query.dto';
import { AuditTrailAction } from './entities/audit-trail.entity';
import { ClosureRecord } from './entities/closure-record.entity';
import { CorrectiveAction } from './entities/corrective-action.entity';
import { HazardCategory } from './entities/hazard-category.entity';
import {
  HazardPriority,
  HazardReport,
  HazardReportStatus,
} from './entities/hazard-report.entity';
import { InvestigationDetail } from './entities/investigation-detail.entity';
import { SeverityLevel } from './entities/severity-level.entity';
import { HazardReportAuditService } from './hazard-report-audit.service';

@Injectable()
export class HazardReportsService implements OnModuleInit {
  private readonly logger = new Logger(HazardReportsService.name);

  constructor(
    @InjectRepository(HazardReport)
    private readonly hazardReportRepository: Repository<HazardReport>,
    @InjectRepository(InvestigationDetail)
    private readonly investigationDetailRepository: Repository<InvestigationDetail>,
    @InjectRepository(CorrectiveAction)
    private readonly correctiveActionRepository: Repository<CorrectiveAction>,
    @InjectRepository(ClosureRecord)
    private readonly closureRecordRepository: Repository<ClosureRecord>,
    @InjectRepository(HazardCategory)
    private readonly hazardCategoryRepository: Repository<HazardCategory>,
    @InjectRepository(SeverityLevel)
    private readonly severityLevelRepository: Repository<SeverityLevel>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly aiService: AiService,
    private readonly hazardReportAuditService: HazardReportAuditService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillMissingAiPredictions();
  }

  private async backfillMissingAiPredictions(): Promise<void> {
    const reports = await this.hazardReportRepository.find({
      where: [{ aiConfidence: IsNull() }, { aiConfidence: '0.00' }],
      relations: {
        hazardCategory: true,
        severityLevel: true,
      },
    });

    if (reports.length === 0) {
      return;
    }

    const priorityMap: Record<'High' | 'Medium' | 'Low', HazardPriority> = {
      High: HazardPriority.High,
      Medium: HazardPriority.Medium,
      Low: HazardPriority.Low,
    };

    for (const report of reports) {
      const prediction = this.aiService.predictPriority(
        report.hazardCategory.name,
        report.severityLevel.name,
        report.recurrenceCount,
        report.reportedAt.getDay() === 0 || report.reportedAt.getDay() === 6,
        report.title,
        report.description,
      );
      report.aiPriority = priorityMap[prediction.priority];
      report.aiConfidence = prediction.confidence.toFixed(2);
    }

    await this.hazardReportRepository.save(reports);
    this.logger.log(
      `Backfilled AI predictions for ${reports.length} hazard report(s).`,
    );
  }

  async findHazardReportsForUser(
    user: AuthenticatedUser,
    query: ListHazardReportsQueryDto = new ListHazardReportsQueryDto(),
  ): Promise<HazardReport[]> {
    const queryBuilder = this.hazardReportRepository
      .createQueryBuilder('hazardReport')
      .leftJoinAndSelect('hazardReport.department', 'department')
      .leftJoinAndSelect('hazardReport.hazardCategory', 'hazardCategory')
      .leftJoinAndSelect('hazardReport.severityLevel', 'severityLevel')
      .leftJoinAndSelect('hazardReport.reporter', 'reporter')
      .leftJoinAndSelect('reporter.department', 'reporterDepartment')
      .leftJoinAndSelect('hazardReport.assignedOfficer', 'assignedOfficer')
      .leftJoinAndSelect(
        'hazardReport.investigationDetail',
        'investigationDetail',
      )
      .leftJoinAndSelect('hazardReport.correctiveActions', 'correctiveActions')
      .leftJoinAndSelect('hazardReport.closureRecord', 'closureRecord')
      .orderBy('hazardReport.reportedAt', 'DESC');

    if (user.role === 'admin' || user.role === 'manager') {
      // Admins and managers can filter across all reports.
    } else if (user.role === 'safety_officer') {
      // Safety officers can never escape their assigned-report scope, even
      // when a broader filter is supplied by the client.
      queryBuilder.andWhere('assignedOfficer.id = :userId', {
        userId: user.id,
      });
    } else {
      // Reporters can only see reports they submitted.
      queryBuilder.andWhere('reporter.id = :userId', {
        userId: user.id,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('hazardReport.status = :status', {
        status: query.status,
      });
    }

    if (query.aiPriority) {
      queryBuilder.andWhere('hazardReport.aiPriority = :aiPriority', {
        aiPriority: query.aiPriority,
      });
    }

    if (query.departmentId) {
      queryBuilder.andWhere('department.id = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    if (query.hazardCategoryId) {
      queryBuilder.andWhere('hazardCategory.id = :hazardCategoryId', {
        hazardCategoryId: query.hazardCategoryId,
      });
    }

    if (query.severityLevelId) {
      queryBuilder.andWhere('severityLevel.id = :severityLevelId', {
        severityLevelId: query.severityLevelId,
      });
    }

    if (query.assignedOfficerId) {
      queryBuilder.andWhere('assignedOfficer.id = :assignedOfficerId', {
        assignedOfficerId: query.assignedOfficerId,
      });
    }

    if (query.reporterId) {
      queryBuilder.andWhere('reporter.id = :reporterId', {
        reporterId: query.reporterId,
      });
    }

    if (query.search?.trim()) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      queryBuilder.andWhere(
        new Brackets((where) => {
          where
            .where('LOWER(hazardReport.title) LIKE :search', { search })
            .orWhere('LOWER(hazardReport.description) LIKE :search', {
              search,
            });
        }),
      );
    }

    if (query.fromDate) {
      queryBuilder.andWhere('hazardReport.reportedAt >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }

    if (query.toDate) {
      const toDate = new Date(query.toDate);
      // Date-only filters are inclusive of the requested calendar day.
      if (/^\d{4}-\d{2}-\d{2}$/.test(query.toDate)) {
        toDate.setDate(toDate.getDate() + 1);
      }
      queryBuilder.andWhere('hazardReport.reportedAt < :toDate', { toDate });
    }

    return queryBuilder.getMany();
  }

  async findHazardReportForUser(
    id: string,
    user: AuthenticatedUser,
  ): Promise<HazardReport> {
    const hazardReport = await this.findHazardReportById(id);

    const canViewReport =
      user.role === 'admin' ||
      user.role === 'manager' ||
      (user.role === 'safety_officer' &&
        hazardReport.assignedOfficer?.id === user.id) ||
      (user.role === 'reporter' &&
        hazardReport.reporter.id === user.id);

    if (!canViewReport) {
      // Keep inaccessible reports indistinguishable from missing reports.
      throw new NotFoundException('Hazard report not found.');
    }

    return hazardReport;
  }

  async createHazardReport(
    reporterId: string,
    createHazardReportDto: CreateHazardReportDto,
  ): Promise<HazardReport> {
    const reporter = await this.employeeRepository.findOne({
      where: { id: reporterId },
      relations: { department: true },
    });

    if (!reporter) {
      throw new NotFoundException('Reporter not found.');
    }

    const hazardCategory = await this.hazardCategoryRepository.findOne({
      where: { id: createHazardReportDto.hazardCategoryId },
    });

    if (!hazardCategory) {
      throw new NotFoundException('Hazard category not found.');
    }

    const severityLevel = await this.severityLevelRepository.findOne({
      where: { id: createHazardReportDto.severityLevelId },
    });

    if (!severityLevel) {
      throw new NotFoundException('Severity level not found.');
    }

    const recurrenceStartDate = new Date();
    recurrenceStartDate.setMonth(recurrenceStartDate.getMonth() - 12);

    const recurrenceCount = await this.hazardReportRepository.count({
      where: {
        department: { id: reporter.department.id },
        hazardCategory: { id: hazardCategory.id },
        reportedAt: MoreThanOrEqual(recurrenceStartDate),
      },
    });

    const hazardReport = this.hazardReportRepository.create({
      title: createHazardReportDto.title,
      description: createHazardReportDto.description,
      department: reporter.department,
      hazardCategory,
      severityLevel,
      reporter,
      aiPriority: createHazardReportDto.aiPriority ?? HazardPriority.Low,
      aiConfidence:
        createHazardReportDto.aiConfidence !== undefined
          ? createHazardReportDto.aiConfidence.toFixed(2)
          : null,
      recurrenceCount,
      status: HazardReportStatus.Reported,
    });

    const savedReport = await this.hazardReportRepository.save(hazardReport);

    const aiPrediction = this.aiService.predictPriority(
      hazardCategory.name,
      severityLevel.name,
      recurrenceCount,
      savedReport.reportedAt.getDay() === 0 ||
        savedReport.reportedAt.getDay() === 6,
      savedReport.title,
      savedReport.description,
    );

    const priorityMap: Record<'High' | 'Medium' | 'Low', HazardPriority> = {
      High: HazardPriority.High,
      Medium: HazardPriority.Medium,
      Low: HazardPriority.Low,
    };

    savedReport.aiPriority = priorityMap[aiPrediction.priority];
    savedReport.aiConfidence = aiPrediction.confidence.toFixed(2);

    const updatedReport = await this.hazardReportRepository.save(savedReport);

    await this.hazardReportAuditService.recordStatusTransition({
      recordId: updatedReport.id,
      action: AuditTrailAction.Create,
      oldValues: null,
      newValues: {
        status: updatedReport.status,
        title: updatedReport.title,
        departmentId: reporter.department.id,
        hazardCategoryId: hazardCategory.id,
        severityLevelId: severityLevel.id,
        aiPriority: updatedReport.aiPriority,
        aiConfidence: updatedReport.aiConfidence,
      },
    });

    return this.findHazardReportById(updatedReport.id);
  }

  async assignOfficer(
    hazardReportId: string,
    assignHazardReportDto: AssignHazardReportDto,
    actor: AuthenticatedUser,
  ): Promise<HazardReport> {
    const hazardReport = await this.findHazardReportEntity(hazardReportId);

    const assignedOfficer = await this.employeeRepository.findOne({
      where: { id: assignHazardReportDto.assignedOfficerId },
    });

    if (!assignedOfficer) {
      throw new NotFoundException('Assigned officer not found.');
    }

    if (assignedOfficer.role !== 'safety_officer') {
      throw new ForbiddenException(
        'Assigned employee must be a safety officer.',
      );
    }

    const previousStatus = hazardReport.status;
    const previousAssignedOfficerId = hazardReport.assignedOfficer?.id ?? null;
    hazardReport.assignedOfficer = assignedOfficer;
    hazardReport.status = HazardReportStatus.Investigating;

    const updatedReport = await this.hazardReportRepository.save(hazardReport);

    await this.hazardReportAuditService.recordStatusTransition({
      recordId: updatedReport.id,
      action: AuditTrailAction.Assign,
      oldValues: {
        status: previousStatus,
        assignedOfficerId: previousAssignedOfficerId,
      },
      newValues: {
        status: updatedReport.status,
        assignedOfficerId: assignedOfficer.id,
      },
    });

    return this.findHazardReportById(updatedReport.id);
  }

  async investigate(
    hazardReportId: string,
    investigateHazardReportDto: InvestigateHazardReportDto,
    actor: AuthenticatedUser,
  ): Promise<HazardReport> {
    const hazardReport = await this.findHazardReportEntity(hazardReportId);

    if (
      actor.role !== 'manager' &&
      hazardReport.assignedOfficer?.id !== actor.id
    ) {
      throw new ForbiddenException(
        'Only the assigned safety officer can investigate this report.',
      );
    }

    const existingInvestigation =
      await this.investigationDetailRepository.findOne({
        where: { hazardReport: { id: hazardReport.id } },
      });

    const investigationDetail = existingInvestigation
      ? this.investigationDetailRepository.merge(
          existingInvestigation,
          investigateHazardReportDto,
        )
      : this.investigationDetailRepository.create({
          ...investigateHazardReportDto,
          hazardReport,
        });

    if (existingInvestigation) {
      investigationDetail.hazardReport = hazardReport;
    }

    const previousStatus = hazardReport.status;
    hazardReport.status = HazardReportStatus.CorrectiveAction;

    await this.investigationDetailRepository.save(investigationDetail);
    const updatedReport = await this.hazardReportRepository.save(hazardReport);

    await this.hazardReportAuditService.recordStatusTransition({
      recordId: updatedReport.id,
      action: AuditTrailAction.Update,
      oldValues: { status: previousStatus },
      newValues: { status: updatedReport.status },
    });

    return this.findHazardReportById(updatedReport.id);
  }

  async updateStatus(
    hazardReportId: string,
    updateStatusDto: UpdateHazardReportStatusDto,
    actor: AuthenticatedUser,
  ): Promise<HazardReport> {
    const hazardReport = await this.findHazardReportEntity(hazardReportId);
    const previousStatus = hazardReport.status;

    if (updateStatusDto.status === HazardReportStatus.Closed) {
      throw new ForbiddenException(
        'Use the close endpoint to close a resolved hazard report.',
      );
    }

    hazardReport.status = updateStatusDto.status;
    const updatedReport = await this.hazardReportRepository.save(hazardReport);

    await this.hazardReportAuditService.recordStatusTransition({
      recordId: updatedReport.id,
      action: AuditTrailAction.Update,
      oldValues: { status: previousStatus, changedBy: actor.id },
      newValues: { status: updatedReport.status, changedBy: actor.id },
    });

    return this.findHazardReportById(updatedReport.id);
  }

  async addCorrectiveAction(
    hazardReportId: string,
    createCorrectiveActionDto: CreateCorrectiveActionDto,
    actor: AuthenticatedUser,
  ): Promise<CorrectiveAction> {
    const hazardReport = await this.findHazardReportEntity(hazardReportId);

    if (
      actor.role !== 'manager' &&
      hazardReport.assignedOfficer?.id !== actor.id
    ) {
      throw new ForbiddenException(
        'Only the assigned safety officer can add corrective actions.',
      );
    }

    const correctiveAction = this.correctiveActionRepository.create({
      ...createCorrectiveActionDto,
      completed: createCorrectiveActionDto.completed ?? false,
      hazardReport,
    });

    return this.correctiveActionRepository.save(correctiveAction);
  }

  async updateCorrectiveAction(
    hazardReportId: string,
    correctiveActionId: string,
    updateCorrectiveActionDto: UpdateCorrectiveActionDto,
    actor: AuthenticatedUser,
  ): Promise<CorrectiveAction> {
    const correctiveAction = await this.correctiveActionRepository.findOne({
      where: {
        id: correctiveActionId,
        hazardReport: { id: hazardReportId },
      },
      relations: { hazardReport: { assignedOfficer: true } },
    });

    if (!correctiveAction) {
      throw new NotFoundException('Corrective action not found.');
    }

    if (
      actor.role !== 'manager' &&
      correctiveAction.hazardReport.assignedOfficer?.id !== actor.id
    ) {
      throw new ForbiddenException(
        'Only the assigned safety officer can update corrective actions.',
      );
    }

    if (updateCorrectiveActionDto.actionDescription !== undefined) {
      correctiveAction.actionDescription =
        updateCorrectiveActionDto.actionDescription;
    }

    if (updateCorrectiveActionDto.responsiblePerson !== undefined) {
      correctiveAction.responsiblePerson =
        updateCorrectiveActionDto.responsiblePerson;
    }

    if (updateCorrectiveActionDto.dueDate !== undefined) {
      correctiveAction.dueDate = updateCorrectiveActionDto.dueDate;
    }

    if (updateCorrectiveActionDto.completed !== undefined) {
      correctiveAction.completed = updateCorrectiveActionDto.completed;
    }

    return this.correctiveActionRepository.save(correctiveAction);
  }

  async closeReport(
    hazardReportId: string,
    closeHazardReportDto: CloseHazardReportDto,
    actor: AuthenticatedUser,
  ): Promise<HazardReport> {
    const hazardReport = await this.findHazardReportEntity(hazardReportId);

    if (
      actor.role !== 'manager' &&
      hazardReport.assignedOfficer?.id !== actor.id
    ) {
      throw new ForbiddenException(
        'Only the assigned safety officer can close this report.',
      );
    }

    const closureRecord = this.closureRecordRepository.create({
      closureNotes: closeHazardReportDto.closureNotes,
      effectivenessCheck: closeHazardReportDto.effectivenessCheck ?? null,
      hazardReport,
    });

    const previousStatus = hazardReport.status;
    hazardReport.status = HazardReportStatus.Closed;

    await this.closureRecordRepository.save(closureRecord);
    const updatedReport = await this.hazardReportRepository.save(hazardReport);

    await this.hazardReportAuditService.recordStatusTransition({
      recordId: updatedReport.id,
      action: AuditTrailAction.Close,
      oldValues: { status: previousStatus },
      newValues: { status: updatedReport.status },
    });

    return this.findHazardReportById(updatedReport.id);
  }

  async findHazardReportById(id: string): Promise<HazardReport> {
    const hazardReport = await this.hazardReportRepository.findOne({
      where: { id },
      relations: {
        department: true,
        hazardCategory: true,
        severityLevel: true,
        reporter: { department: true },
        assignedOfficer: true,
        investigationDetail: true,
        correctiveActions: true,
        closureRecord: true,
      },
    });

    if (!hazardReport) {
      throw new NotFoundException('Hazard report not found.');
    }

    return hazardReport;
  }

  private async findHazardReportEntity(id: string): Promise<HazardReport> {
    const hazardReport = await this.hazardReportRepository.findOne({
      where: { id },
      relations: { assignedOfficer: true },
    });

    if (!hazardReport) {
      throw new NotFoundException('Hazard report not found.');
    }

    return hazardReport;
  }
}
