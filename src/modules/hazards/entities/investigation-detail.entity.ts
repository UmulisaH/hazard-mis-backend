import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { HazardReport } from './hazard-report.entity';

@Entity({ name: 'investigation_details' })
export class InvestigationDetail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  findings!: string;

  @Column({ name: 'root_cause', type: 'text' })
  rootCause!: string;

  @Column({
    name: 'contributing_factors',
    type: 'jsonb',
    default: () => "'[]'::jsonb",
  })
  contributingFactors!: string[];

  @CreateDateColumn({ name: 'investigation_date' })
  investigationDate!: Date;

  @OneToOne(() => HazardReport, (report) => report.investigationDetail, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hazard_report_id' })
  hazardReport!: HazardReport;
}
