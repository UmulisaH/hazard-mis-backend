import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import {
  AuditTrail,
  AuditTrailAction,
} from './modules/hazards/entities/audit-trail.entity';
import { ClosureRecord } from './modules/hazards/entities/closure-record.entity';
import { CorrectiveAction } from './modules/hazards/entities/corrective-action.entity';
import { HazardCategory } from './modules/hazards/entities/hazard-category.entity';
import {
  HazardPriority,
  HazardReport,
  HazardReportStatus,
} from './modules/hazards/entities/hazard-report.entity';
import { InvestigationDetail } from './modules/hazards/entities/investigation-detail.entity';
import { SeverityLevel } from './modules/hazards/entities/severity-level.entity';
import { Department } from './modules/institutions/entities/department.entity';
import { Institution } from './modules/institutions/entities/institution.entity';
import { Employee } from './modules/users/entities/employee.entity';

const logger = new Logger('Seed');

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const dataSource = app.get(DataSource);

    const institutionRepository = dataSource.getRepository(Institution);
    const departmentRepository = dataSource.getRepository(Department);
    const employeeRepository = dataSource.getRepository(Employee);
    const hazardCategoryRepository = dataSource.getRepository(HazardCategory);
    const severityLevelRepository = dataSource.getRepository(SeverityLevel);
    const hazardReportRepository = dataSource.getRepository(HazardReport);
    const investigationDetailRepository =
      dataSource.getRepository(InvestigationDetail);
    const correctiveActionRepository =
      dataSource.getRepository(CorrectiveAction);
    const closureRecordRepository = dataSource.getRepository(ClosureRecord);
    const auditTrailRepository = dataSource.getRepository(AuditTrail);

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const institutions = [
      {
        name: 'Rwanda Manufacturing Co',
        rssbCode: 'RMC-001',
        address: 'Kigali Industrial Zone',
        contactPhone: '+250788000001',
        contactEmail: 'info@rwandamanufacturing.co',
      },
      {
        name: 'Agro Safe Ltd',
        rssbCode: 'AGRO-002',
        address: 'Musanze Processing Park',
        contactPhone: '+250788000002',
        contactEmail: 'hello@agrosafe.rw',
      },
    ];

    for (const institutionSeed of institutions) {
      const existing = await institutionRepository.findOne({
        where: { rssbCode: institutionSeed.rssbCode },
      });

      if (!existing) {
        await institutionRepository.save(
          institutionRepository.create(institutionSeed),
        );
      }
    }

    const savedInstitutions = await institutionRepository.find();
    const primaryInstitution = savedInstitutions[0];
    const secondaryInstitution = savedInstitutions[1] ?? savedInstitutions[0];

    const departments = [
      {
        name: 'Assembly Line',
        description: 'Production assembly operations.',
        institution: primaryInstitution,
      },
      {
        name: 'Quality Assurance',
        description: 'Inspection and quality control.',
        institution: primaryInstitution,
      },
      {
        name: 'Chemical Processing',
        description: 'Chemical handling and processing area.',
        institution: secondaryInstitution,
      },
    ];

    for (const departmentSeed of departments) {
      const existing = await departmentRepository.findOne({
        where: { name: departmentSeed.name },
      });

      if (!existing) {
        await departmentRepository.save(
          departmentRepository.create(departmentSeed),
        );
      }
    }

    const savedDepartments = await departmentRepository.find({
      relations: { institution: true },
    });
    const assemblyDepartment =
      savedDepartments.find(
        (department) => department.name === 'Assembly Line',
      ) ?? savedDepartments[0];
    const qaDepartment =
      savedDepartments.find(
        (department) => department.name === 'Quality Assurance',
      ) ?? savedDepartments[0];
    const chemicalDepartment =
      savedDepartments.find(
        (department) => department.name === 'Chemical Processing',
      ) ?? savedDepartments[0];

    const employees = [
      {
        email: 'reporter@hazardmis.local',
        passwordHash,
        fullName: 'John Reporter',
        jobTitle: 'Operator',
        phone: '+250788100001',
        isSafetyOfficer: false,
        isAdmin: false,
        department: assemblyDepartment,
      },
      {
        email: 'officer@hazardmis.local',
        passwordHash,
        fullName: 'Sarah Officer',
        jobTitle: 'Safety Officer',
        phone: '+250788100002',
        isSafetyOfficer: true,
        isAdmin: false,
        department: assemblyDepartment,
      },
      {
        email: 'admin@hazardmis.local',
        passwordHash,
        fullName: 'Alice Admin',
        jobTitle: 'Administrator',
        phone: '+250788100003',
        isSafetyOfficer: true,
        isAdmin: true,
        department: qaDepartment,
      },
    ];

    for (const employeeSeed of employees) {
      const existing = await employeeRepository.findOne({
        where: { email: employeeSeed.email },
      });

      if (!existing) {
        await employeeRepository.save(employeeRepository.create(employeeSeed));
      }
    }

    const savedEmployees = await employeeRepository.find({
      relations: { department: true },
    });
    const reporter =
      savedEmployees.find(
        (employee) => employee.email === 'reporter@hazardmis.local',
      ) ?? savedEmployees[0];
    const safetyOfficer =
      savedEmployees.find(
        (employee) => employee.email === 'officer@hazardmis.local',
      ) ?? savedEmployees[0];
    const admin =
      savedEmployees.find(
        (employee) => employee.email === 'admin@hazardmis.local',
      ) ?? savedEmployees[0];

    const categories = await hazardCategoryRepository.find();
    const severities = await severityLevelRepository.find();
    const machinery =
      categories.find((category) => category.name === 'Machinery') ??
      categories[0];
    const chemical =
      categories.find((category) => category.name === 'Chemical') ??
      categories[0];
    const slipFall =
      categories.find((category) => category.name === 'Slip/Trip/Fall') ??
      categories[0];
    const high =
      severities.find((severity) => severity.name === 'High') ?? severities[0];
    const medium =
      severities.find((severity) => severity.name === 'Medium') ??
      severities[0];
    const critical =
      severities.find((severity) => severity.name === 'Critical') ??
      severities[0];

    const reportSeeds = [
      {
        title: 'Loose guard on conveyor',
        description: 'Machine guard is loose near the assembly conveyor.',
        department: assemblyDepartment,
        hazardCategory: machinery,
        severityLevel: high,
        reporter,
        assignedOfficer: safetyOfficer,
        recurrenceCount: 2,
        aiPriority: HazardPriority.High,
        aiConfidence: '0.88',
        status: HazardReportStatus.Investigating,
      },
      {
        title: 'Solvent smell in storage room',
        description: 'Strong chemical odor detected near solvent storage.',
        department: chemicalDepartment,
        hazardCategory: chemical,
        severityLevel: critical,
        reporter: admin,
        assignedOfficer: admin,
        recurrenceCount: 1,
        aiPriority: HazardPriority.High,
        aiConfidence: '0.91',
        status: HazardReportStatus.Closed,
      },
      {
        title: 'Wet floor by loading bay',
        description: 'Standing water near loading bay causing slip risk.',
        department: qaDepartment,
        hazardCategory: slipFall,
        severityLevel: medium,
        reporter,
        assignedOfficer: null,
        recurrenceCount: 3,
        aiPriority: HazardPriority.Medium,
        aiConfidence: '0.64',
        status: HazardReportStatus.Reported,
      },
    ];

    const savedReports: HazardReport[] = [];

    for (const reportSeed of reportSeeds) {
      const existing = await hazardReportRepository.findOne({
        where: { title: reportSeed.title },
      });

      if (existing) {
        savedReports.push(existing);
        continue;
      }

      const created = await hazardReportRepository.save(
        hazardReportRepository.create({
          title: reportSeed.title,
          description: reportSeed.description,
          department: reportSeed.department,
          hazardCategory: reportSeed.hazardCategory,
          severityLevel: reportSeed.severityLevel,
          reporter: reportSeed.reporter,
          assignedOfficer: reportSeed.assignedOfficer,
          recurrenceCount: reportSeed.recurrenceCount,
          aiPriority: reportSeed.aiPriority,
          aiConfidence: reportSeed.aiConfidence,
          status: reportSeed.status,
        }),
      );

      savedReports.push(created);
    }

    const firstReport = savedReports.find(
      (report) => report.title === 'Loose guard on conveyor',
    );
    const secondReport = savedReports.find(
      (report) => report.title === 'Solvent smell in storage room',
    );

    if (firstReport) {
      const investigation = await investigationDetailRepository.findOne({
        where: { hazardReport: { id: firstReport.id } },
      });

      if (!investigation) {
        await investigationDetailRepository.save(
          investigationDetailRepository.create({
            findings: 'Guard was partially detached during maintenance.',
            rootCause: 'Loose fixing bolts after service.',
            contributingFactors: [
              'Maintenance gap',
              'Missing inspection checklist',
            ],
            hazardReport: firstReport,
          }),
        );
      }

      const correctiveActionExists = await correctiveActionRepository.findOne({
        where: { hazardReport: { id: firstReport.id } },
      });

      if (!correctiveActionExists) {
        await correctiveActionRepository.save(
          correctiveActionRepository.create({
            actionDescription: 'Tighten and secure conveyor guard bolts.',
            responsiblePerson: 'Maintenance Lead',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10),
            completed: false,
            hazardReport: firstReport,
          }),
        );
      }
    }

    if (secondReport) {
      const closureExists = await closureRecordRepository.findOne({
        where: { hazardReport: { id: secondReport.id } },
      });

      if (!closureExists) {
        await closureRecordRepository.save(
          closureRecordRepository.create({
            closureNotes: 'Ventilation improved and solvents relocated.',
            effectivenessCheck:
              'Follow-up inspection showed normal air quality.',
            hazardReport: secondReport,
          }),
        );
      }
    }

    const auditExists = await auditTrailRepository.count();
    if (auditExists === 0) {
      for (const report of savedReports) {
        await auditTrailRepository.save(
          auditTrailRepository.create({
            tableName: 'hazard_reports',
            recordId: report.id,
            action: AuditTrailAction.Create,
            oldValues: null,
            newValues: {
              title: report.title,
              status: report.status,
            },
          }),
        );
      }
    }

    logger.log(
      'Seed data created or confirmed for institutions, departments, users, hazard references, and sample hazard workflows.',
    );
  } finally {
    await app.close();
  }
}

seed().catch((error) => {
  logger.error(error instanceof Error ? error.message : 'Seed failed');
  process.exit(1);
});
