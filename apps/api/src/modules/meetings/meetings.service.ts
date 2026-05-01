import { Injectable } from '@nestjs/common';
import { CreateMeetingDto, MeetingStatus, UpdateMeetingStatusDto } from '@meeting-intelligence/shared';
import type { AuthUser } from '../common/auth-user.interface';
import { MeetingsRepository } from './meetings.repository';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly meetingsRepository: MeetingsRepository,
    private readonly storage: StorageService,
  ) {}

  create(authUser: AuthUser, payload: CreateMeetingDto) {
    return this.meetingsRepository.create({
      authUser,
      organizationId: payload.organizationId,
      teamId: payload.teamId,
      title: payload.title,
      source: payload.source,
      scheduledAt: payload.scheduledAt,
      participants: payload.participants ?? [],
    });
  }

  list(authUser: AuthUser, organizationId?: string) {
    return this.meetingsRepository.list(authUser, organizationId);
  }

  getById(authUser: AuthUser, meetingId: string) {
    return this.meetingsRepository.getById(authUser, meetingId);
  }

  updateStatus(authUser: AuthUser, meetingId: string, payload: UpdateMeetingStatusDto) {
    return this.meetingsRepository.updateStatus(authUser, meetingId, payload.status as MeetingStatus);
  }

  async createUploadSession(authUser: AuthUser, meetingId: string, fileName: string, contentType: string) {
    await this.meetingsRepository.ensureMeetingExists(authUser, meetingId);
    const key = `meetings/${meetingId}/${Date.now()}-${encodeURIComponent(fileName)}`;
    const uploadUrl = await this.storage.getPresignedUploadUrl(key, contentType);
    return {
      meetingId,
      fileName,
      contentType,
      storageKey: key,
      uploadUrl,
      expiresInSeconds: 900,
    };
  }
}
