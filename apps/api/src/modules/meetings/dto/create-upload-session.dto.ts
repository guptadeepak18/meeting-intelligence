import { IsString, IsUUID } from 'class-validator';

export class CreateUploadSessionDto {
  @IsUUID()
  meetingId!: string;

  @IsString()
  fileName!: string;

  @IsString()
  contentType!: string;
}
