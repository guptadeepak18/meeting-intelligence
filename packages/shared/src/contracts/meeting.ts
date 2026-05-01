import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { z } from 'zod';

export const meetingStatusSchema = z.enum([
  'uploaded',
  'processing_transcription',
  'transcribed',
  'tasks_created',
  'failed',
]);

export const createMeetingSchema = z.object({
  organizationId: z.string().uuid(),
  teamId: z.string().uuid(),
  title: z.string().min(1),
  scheduledAt: z.string().datetime().nullable(),
  source: z.string().nullable(),
  participants: z.array(z.string().email()).default([]),
});

export const meetingParticipantSchema = z.object({
  displayName: z.string().min(1),
  email: z.string().email().nullable(),
  speakerLabel: z.string().nullable(),
  userId: z.string().uuid().nullable(),
});

export type MeetingStatus = z.infer<typeof meetingStatusSchema>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type MeetingParticipant = z.infer<typeof meetingParticipantSchema>;

export class CreateMeetingDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  teamId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsArray()
  @IsString({ each: true })
  participants!: string[];
}

export class UpdateMeetingStatusDto {
  @IsEnum(['uploaded', 'processing_transcription', 'transcribed', 'tasks_created', 'failed'])
  status!: MeetingStatus;
}
