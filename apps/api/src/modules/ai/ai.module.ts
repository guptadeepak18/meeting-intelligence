import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AssignmentResolverService } from './assignment-resolver.service';
import { AiController } from './ai.controller';
import { AiRepository } from './ai.repository';
import { AiService } from './ai.service';
import { ExtractionEngineService } from './extraction-engine.service';
import { TranscriptionAdapterService } from './transcription-adapter.service';

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiRepository,
    ExtractionEngineService,
    TranscriptionAdapterService,
    AssignmentResolverService,
  ],
})
export class AiModule {}
