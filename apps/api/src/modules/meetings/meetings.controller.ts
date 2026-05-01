import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateMeetingDto, UpdateMeetingStatusDto } from '@meeting-intelligence/shared';
import type { AuthenticatedRequest } from '../common/auth-user.interface';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { CreateUploadSessionDto } from './dto/create-upload-session.dto';
import { MeetingsService } from './meetings.service';

@Controller({ path: 'meetings', version: '1' })
@UseGuards(ClerkAuthGuard, RbacGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  @Roles('admin', 'manager')
  createMeeting(@Req() request: AuthenticatedRequest, @Body() payload: CreateMeetingDto) {
    return this.meetingsService.create(request.authUser!, payload);
  }

  @Get()
  @Roles('admin', 'manager', 'employee')
  listMeetings(@Req() request: AuthenticatedRequest, @Query('organizationId') organizationId?: string) {
    return this.meetingsService.list(request.authUser!, organizationId);
  }

  @Get(':meetingId')
  @Roles('admin', 'manager', 'employee')
  getMeeting(@Req() request: AuthenticatedRequest, @Param('meetingId') meetingId: string) {
    return this.meetingsService.getById(request.authUser!, meetingId);
  }

  @Patch(':meetingId/status')
  @Roles('admin', 'manager')
  updateMeetingStatus(
    @Req() request: AuthenticatedRequest,
    @Param('meetingId') meetingId: string,
    @Body() payload: UpdateMeetingStatusDto,
  ) {
    return this.meetingsService.updateStatus(request.authUser!, meetingId, payload);
  }

  @Post(':meetingId/upload-session')
  @Roles('admin', 'manager')
  createUploadSession(
    @Req() request: AuthenticatedRequest,
    @Param('meetingId') meetingId: string,
    @Body() payload: Omit<CreateUploadSessionDto, 'meetingId'>,
  ) {
    return this.meetingsService.createUploadSession(
      request.authUser!,
      meetingId,
      payload.fileName,
      payload.contentType,
    );
  }
}
