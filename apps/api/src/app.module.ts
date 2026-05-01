import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AiModule } from './modules/ai/ai.module';
import { AuthModule } from './modules/auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthController } from './modules/health/health.controller';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TranscriptsModule } from './modules/transcripts/transcripts.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    MeetingsModule,
    TranscriptsModule,
    TasksModule,
    NotificationsModule,
    DashboardModule,
    AiModule,
    ComplianceModule,
    StorageModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
