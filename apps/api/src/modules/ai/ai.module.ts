import { Module } from '@nestjs/common';
import { AssignmentResolverService } from './assignment-resolver.service';
import { AiController } from './ai.controller';
import { AiRepository } from './ai.repository';
import { AiService } from './ai.service';
import { ExtractionEngineService } from './extraction-engine.service';
import { TranscriptionAdapterService } from './transcription-adapter.service';

@Module({
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
