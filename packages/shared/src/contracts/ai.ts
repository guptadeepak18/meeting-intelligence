import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { z } from 'zod';

export const extractedActionItemSchema = z.object({
  title: z.string().min(1),
  ownerCandidate: z.string().nullable(),
  dueDate: z.string().datetime().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
});

export const extractionOutputSchema = z.object({
  actionItems: z.array(extractedActionItemSchema),
});

export type ExtractionOutput = z.infer<typeof extractionOutputSchema>;

export class ExtractedActionItemDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  ownerCandidate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority!: 'low' | 'medium' | 'high' | 'critical';

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsString()
  rationale!: string;
}

export class ExtractionOutputDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedActionItemDto)
  actionItems!: ExtractedActionItemDto[];
}

export class CreateAiRunDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  meetingId!: string;

  @IsUUID()
  promptVersionId!: string;

  @IsString()
  provider!: string;

  @IsString()
  model!: string;

  @IsString()
  idempotencyKey!: string;
}
