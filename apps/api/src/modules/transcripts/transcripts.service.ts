import { Injectable } from '@nestjs/common';
import { IngestTranscriptDto } from '@meeting-intelligence/shared';
import type { AuthUser } from '../common/auth-user.interface';
import { TranscriptsRepository } from './transcripts.repository';

@Injectable()
export class TranscriptsService {
  constructor(private readonly transcriptsRepository: TranscriptsRepository) {}

  ingest(authUser: AuthUser, payload: IngestTranscriptDto) {
    return this.transcriptsRepository.create({
      authUser,
      meetingId: payload.meetingId,
      provider: payload.provider,
      language: payload.language,
      confidence: payload.confidence,
      rawText: payload.rawText,
      utterances: payload.utterances,
    });
  }

  listByMeeting(authUser: AuthUser, meetingId: string) {
    return this.transcriptsRepository.listByMeeting(authUser, meetingId);
  }
}
