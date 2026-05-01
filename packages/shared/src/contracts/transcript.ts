import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { z } from 'zod';

export const utteranceSchema = z.object({
  segmentIndex: z.number().int().nonnegative(),
  speakerLabel: z.string().min(1).nullable(),
  startMs: z.number().int().nonnegative(),
  endMs: z.number().int().positive(),
  text: z.string().min(1),
  confidence: z.number().min(0).max(1).nullable(),
});

export const transcriptPayloadSchema = z.object({
  meetingId: z.string().uuid(),
  language: z.string().min(2).nullable(),
  provider: z.string().min(1),
  confidence: z.number().min(0).max(1).nullable(),
  rawText: z.string().nullable(),
  utterances: z.array(utteranceSchema).min(1),
});

export type UtterancePayload = z.infer<typeof utteranceSchema>;
export type TranscriptPayload = z.infer<typeof transcriptPayloadSchema>;

export class UtteranceDto {
  @IsInt()
  @Min(0)
  segmentIndex!: number;

  @IsOptional()
  @IsString()
  speakerLabel?: string;

  @IsInt()
  @Min(0)
  startMs!: number;

  @IsInt()
  @Min(1)
  endMs!: number;

  @IsString()
  text!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

export class IngestTranscriptDto {
  @IsUUID()
  meetingId!: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsString()
  provider!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsString()
  rawText?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UtteranceDto)
  utterances!: UtteranceDto[];
}
