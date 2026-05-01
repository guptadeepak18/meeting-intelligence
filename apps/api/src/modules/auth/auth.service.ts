import { Injectable } from '@nestjs/common';
import { AddMembershipDto } from '@meeting-intelligence/shared';
import type { AuthUser } from '../common/auth-user.interface';

@Injectable()
export class AuthService {
  getCurrentUser(user: AuthUser | undefined) {
    return {
      authenticated: Boolean(user),
      user,
      provider: 'clerk',
      mode: 'scaffold',
    };
  }

  addMembership(payload: AddMembershipDto) {
    return {
      message: 'Membership request accepted (scaffold)',
      payload,
    };
  }
}
