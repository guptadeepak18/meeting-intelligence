import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplianceRetentionService {
  private readonly logger = new Logger(ComplianceRetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(process.env.RETENTION_PURGE_CRON ?? '0 2 * * *')
  async purgeExpiredArtifacts() {
    if (process.env.RETENTION_PURGE_ENABLED !== 'true') {
      return;
    }

    const now = new Date();

    const transcripts = await this.prisma.transcript.deleteMany({
      where: {
        retentionUntil: { lte: now },
      },
    });

    const audioAssets = await this.prisma.audioAsset.updateMany({
      where: {
        retentionUntil: { lte: now },
        deletedAt: null,
      },
      data: {
        deletedAt: now,
      },
    });

    if (transcripts.count > 0 || audioAssets.count > 0) {
      this.logger.log(
        `Retention purge completed. transcriptsDeleted=${transcripts.count} audioAssetsSoftDeleted=${audioAssets.count}`,
      );
    }
  }
}
