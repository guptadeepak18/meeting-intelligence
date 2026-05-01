import { IsOptional, IsString } from 'class-validator';

export class ProcessMeetingDto {
  @IsOptional()
  @IsString()
  transcriptText?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
