import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceRetentionService } from './compliance-retention.service';

@Module({
  imports: [PrismaModule],
  providers: [ComplianceRetentionService],
})
export class ComplianceModule {}
