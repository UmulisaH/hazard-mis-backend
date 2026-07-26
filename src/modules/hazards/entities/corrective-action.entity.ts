import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HazardReport } from './hazard-report.entity';

@Entity({ name: 'corrective_actions' })
export class CorrectiveAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'action_description', type: 'text' })
  actionDescription!: string;

  @Column({ name: 'responsible_person', type: 'varchar', length: 255 })
  responsiblePerson!: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => HazardReport, (report) => report.correctiveActions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'hazard_report_id' })
  hazardReport!: HazardReport;
}
