import { IsDateString, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueueNotificationDto {
  @IsUUID()
  organizationId!: string;

  @IsUUID()
  userId!: string;

  @IsEnum(['in_app', 'email', 'slack'])
  channel!: 'in_app' | 'email' | 'slack';

  @IsString()
  templateKey!: string;

  @IsObject()
  payload!: Record<string, unknown>;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}
