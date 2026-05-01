import { Module } from '@nestjs/common';
import { TranscriptsController } from './transcripts.controller';
import { TranscriptsRepository } from './transcripts.repository';
import { TranscriptsService } from './transcripts.service';

@Module({
  controllers: [TranscriptsController],
  providers: [TranscriptsService, TranscriptsRepository],
})
export class TranscriptsModule {}
