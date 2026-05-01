import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsRepository } from './meetings.repository';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [AuthModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsRepository],
  exports: [MeetingsService],
})
export class MeetingsModule {}
