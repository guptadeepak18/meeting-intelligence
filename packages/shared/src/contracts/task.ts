import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { z } from 'zod';

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export const taskPrioritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export const actionItemSchema = z.object({
  meetingId: z.string().uuid(),
  title: z.string().min(1),
  assigneeUserId: z.string().uuid().nullable(),
  dueDate: z.string().datetime().nullable(),
  priority: taskPrioritySchema.default('medium'),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  humanReviewRequired: z.boolean().default(false),
});

export const taskStatusTransitionSchema = z.object({
  actionItemId: z.string().uuid(),
  fromStatus: taskStatusSchema.nullable(),
  toStatus: taskStatusSchema,
  reason: z.string().nullable(),
});

export type ActionItem = z.infer<typeof actionItemSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskPriority = z.infer<typeof taskPrioritySchema>;
export type TaskStatusTransition = z.infer<typeof taskStatusTransitionSchema>;

export class CreateActionItemDto {
  @IsUUID()
  meetingId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority!: TaskPriority;

  @IsNumber()
  @Min(0)
  @Max(1)
  confidence!: number;

  @IsString()
  rationale!: string;
}

export class TransitionTaskStatusDto {
  @IsUUID()
  actionItemId!: string;

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  fromStatus?: TaskStatus;

  @IsEnum(['todo', 'in_progress', 'done'])
  toStatus!: TaskStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}
