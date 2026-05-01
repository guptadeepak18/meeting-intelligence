import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IngestTranscriptDto } from '@meeting-intelligence/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import type { AuthenticatedRequest } from '../common/auth-user.interface';
import { TranscriptsService } from './transcripts.service';

@Controller({ path: 'transcripts', version: '1' })
@UseGuards(ClerkAuthGuard, RbacGuard)
export class TranscriptsController {
  constructor(private readonly transcriptsService: TranscriptsService) {}

  @Post('ingest')
  @Roles('admin', 'manager')
  ingestTranscript(@Req() request: AuthenticatedRequest, @Body() payload: IngestTranscriptDto) {
    return this.transcriptsService.ingest(request.authUser!, payload);
  }

  @Get('meeting/:meetingId')
  @Roles('admin', 'manager', 'employee')
  listMeetingTranscripts(@Req() request: AuthenticatedRequest, @Param('meetingId') meetingId: string) {
    return this.transcriptsService.listByMeeting(request.authUser!, meetingId);
  }
}
