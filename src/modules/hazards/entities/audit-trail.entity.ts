import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditTrailAction {
  Create = 'CREATE',
  Update = 'UPDATE',
  Assign = 'ASSIGN',
  Close = 'CLOSE',
}

@Entity({ name: 'audit_trail' })
export class AuditTrail {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'table_name', type: 'varchar', length: 255 })
  tableName!: string;

  @Column({ name: 'record_id', type: 'uuid' })
  recordId!: string;

  @Column({
    type: 'enum',
    enum: AuditTrailAction,
  })
  action!: AuditTrailAction;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues!: Record<string, unknown> | null;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp!: Date;
}
