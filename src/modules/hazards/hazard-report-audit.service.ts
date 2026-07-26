import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTrail, AuditTrailAction } from './entities/audit-trail.entity';

@Injectable()
export class HazardReportAuditService {
  constructor(
    @InjectRepository(AuditTrail)
    private readonly auditTrailRepository: Repository<AuditTrail>,
  ) {}

  async recordStatusTransition(params: {
    recordId: string;
    oldValues: Record<string, unknown> | null;
    newValues: Record<string, unknown> | null;
    action: AuditTrailAction;
  }): Promise<AuditTrail> {
    return this.auditTrailRepository.save(
      this.auditTrailRepository.create({
        tableName: 'hazard_reports',
        recordId: params.recordId,
        action: params.action,
        oldValues: params.oldValues,
        newValues: params.newValues,
      }),
    );
  }
}
