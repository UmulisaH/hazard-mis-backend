import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Department } from '../../institutions/entities/department.entity';
import { Employee } from '../../users/entities/employee.entity';
import { HazardCategory } from './hazard-category.entity';
import { SeverityLevel } from './severity-level.entity';
import { CorrectiveAction } from './corrective-action.entity';
import { InvestigationDetail } from './investigation-detail.entity';
import { ClosureRecord } from './closure-record.entity';

export enum HazardReportStatus {
  Reported = 'Reported',
  Investigating = 'Investigating',
  CorrectiveAction = 'Corrective Action',
  Closed = 'Closed',
}

export enum HazardPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

@Entity({ name: 'hazard_reports' })
export class HazardReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @CreateDateColumn({ name: 'reported_at' })
  reportedAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Index()
  @Column({
    type: 'enum',
    enum: HazardReportStatus,
    default: HazardReportStatus.Reported,
  })
  status!: HazardReportStatus;

  @Column({
    name: 'ai_priority',
    type: 'enum',
    enum: HazardPriority,
    default: HazardPriority.Low,
  })
  aiPriority!: HazardPriority;

  @Column({
    name: 'ai_confidence',
    type: 'numeric',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  aiConfidence!: string | null;

  @Column({ name: 'recurrence_count', type: 'int', default: 0 })
  recurrenceCount!: number;

  @ManyToOne(() => Department, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @ManyToOne(() => HazardCategory, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'hazard_category_id' })
  hazardCategory!: HazardCategory;

  @ManyToOne(() => SeverityLevel, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'severity_level_id' })
  severityLevel!: SeverityLevel;

  @ManyToOne(() => Employee, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reporter_id' })
  reporter!: Employee;

  @ManyToOne(() => Employee, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_officer_id' })
  assignedOfficer!: Employee | null;

  @OneToOne(() => InvestigationDetail, (detail) => detail.hazardReport)
  investigationDetail!: InvestigationDetail | null;

  @OneToMany(() => CorrectiveAction, (action) => action.hazardReport)
  correctiveActions!: CorrectiveAction[];

  @OneToOne(() => ClosureRecord, (record) => record.hazardReport)
  closureRecord!: ClosureRecord | null;
}
