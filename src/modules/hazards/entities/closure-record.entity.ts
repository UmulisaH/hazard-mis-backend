import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HazardReport } from './hazard-report.entity';

@Entity({ name: 'closure_records' })
export class ClosureRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ name: 'closure_date' })
  closureDate!: Date;

  @Column({ name: 'closure_notes', type: 'text' })
  closureNotes!: string;

  @Column({ name: 'effectiveness_check', type: 'text', nullable: true })
  effectivenessCheck!: string | null;

  @OneToOne(() => HazardReport, (report) => report.closureRecord, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hazard_report_id' })
  hazardReport!: HazardReport;
}
