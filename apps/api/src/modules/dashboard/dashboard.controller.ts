import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import type { AuthenticatedRequest } from '../common/auth-user.interface';
import { DashboardService } from './dashboard.service';

@Controller({ path: 'dashboard', version: '1' })
@UseGuards(ClerkAuthGuard, RbacGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles('admin', 'manager', 'employee')
  summary(@Req() request: AuthenticatedRequest, @Query('organizationId') organizationId?: string) {
    return this.dashboardService.getSummary(request.authUser!, organizationId);
  }
}
