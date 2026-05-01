import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class UpsertNotificationPreferencesDto {
  @IsUUID()
  userId!: string;

  @IsEnum(['in_app', 'email', 'slack'])
  preferredChannel!: 'in_app' | 'email' | 'slack';

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  quietHoursStartMinute?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1439)
  quietHoursEndMinute?: number;

  @IsOptional()
  digestEnabled?: boolean;
}
