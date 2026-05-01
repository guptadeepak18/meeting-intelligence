import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CreateAiRunDto, ExtractionOutputDto } from '@meeting-intelligence/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import type { AuthenticatedRequest } from '../common/auth-user.interface';
import { ProcessMeetingDto } from './dto/process-meeting.dto';
import { AiService } from './ai.service';

@Controller({ path: 'ai', version: '1' })
@UseGuards(ClerkAuthGuard, RbacGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('runs')
  @Roles('admin', 'manager')
  createRun(@Req() request: AuthenticatedRequest, @Body() payload: CreateAiRunDto) {
    return this.aiService.createRun(request.authUser!, payload);
  }

  @Post('process/meeting/:meetingId')
  @Roles('admin', 'manager')
  processMeeting(
    @Req() request: AuthenticatedRequest,
    @Param('meetingId') meetingId: string,
    @Body() payload: ProcessMeetingDto,
  ) {
    return this.aiService.processMeeting(request.authUser!, meetingId, payload);
  }

  @Post('runs/:runId/extraction')
  @Roles('admin', 'manager')
  saveExtraction(
    @Req() request: AuthenticatedRequest,
    @Param('runId') runId: string,
    @Body() payload: ExtractionOutputDto,
  ) {
    return this.aiService.attachExtraction(request.authUser!, runId, payload);
  }

  @Get('runs/:runId')
  @Roles('admin', 'manager', 'employee')
  getRun(@Req() request: AuthenticatedRequest, @Param('runId') runId: string) {
    return this.aiService.getRun(request.authUser!, runId);
  }
}
