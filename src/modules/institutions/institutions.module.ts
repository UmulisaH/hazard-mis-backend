import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { Institution } from './entities/institution.entity';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Institution, Department])],
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
  exports: [TypeOrmModule, InstitutionsService],
})
export class InstitutionsModule {}
