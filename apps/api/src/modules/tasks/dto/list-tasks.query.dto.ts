import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListTasksQueryDto {
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @IsOptional()
  @IsEnum(['todo', 'in_progress', 'done'])
  status?: 'todo' | 'in_progress' | 'done';

  @IsOptional()
  @IsEnum(['low', 'medium', 'high', 'critical'])
  priority?: 'low' | 'medium' | 'high' | 'critical';

  @IsOptional()
  @IsISO8601()
  dueBefore?: string;

  @IsOptional()
  @IsISO8601()
  dueAfter?: string;

  @IsOptional()
  @IsString()
  q?: string;
}
