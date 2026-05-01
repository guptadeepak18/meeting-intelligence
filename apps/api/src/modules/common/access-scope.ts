import { ForbiddenException } from '@nestjs/common';
import type { AuthRole, AuthUser } from './auth-user.interface';

export interface AccessScope {
  userId: string;
  role: AuthRole;
  organizationId: string;
  teamId?: string;
}

export function toAccessScope(user: AuthUser | undefined): AccessScope {
  if (!user) {
    throw new ForbiddenException('Missing authenticated user context');
  }

  if (!user.organizationId) {
    throw new ForbiddenException('Missing organization context');
  }

  return {
    userId: user.id,
    role: user.role,
    organizationId: user.organizationId,
    teamId: user.teamId,
  };
}
