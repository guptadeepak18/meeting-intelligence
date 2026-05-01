import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AddMembershipDto } from '@meeting-intelligence/shared';
import type { AuthenticatedRequest } from '../common/auth-user.interface';
import { Roles } from './decorators/roles.decorator';
import { AuthService } from './auth.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { RbacGuard } from './guards/rbac.guard';

@Controller({ path: 'auth', version: '1' })
@UseGuards(ClerkAuthGuard, RbacGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getMe(@Req() request: AuthenticatedRequest) {
    return this.authService.getCurrentUser(request.authUser);
  }

  @Post('memberships')
  @Roles('admin')
  addMembership(@Body() payload: AddMembershipDto) {
    return this.authService.addMembership(payload);
  }
}
