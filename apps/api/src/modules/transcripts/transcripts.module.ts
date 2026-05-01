import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TranscriptsController } from './transcripts.controller';
import { TranscriptsRepository } from './transcripts.repository';
import { TranscriptsService } from './transcripts.service';

@Module({
  imports: [AuthModule],
  controllers: [TranscriptsController],
  providers: [TranscriptsService, TranscriptsRepository],
})
export class TranscriptsModule {}
