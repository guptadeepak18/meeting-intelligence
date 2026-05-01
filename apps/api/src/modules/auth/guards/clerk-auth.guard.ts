import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../common/auth-user.interface';
import { ClerkJwtService } from '../clerk-jwt.service';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private readonly clerkJwtService: ClerkJwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if ((!authHeader || Array.isArray(authHeader)) && process.env.NODE_ENV !== 'production') {
      const devUserId = request.headers['x-dev-user-id'];
      const devOrgId = request.headers['x-dev-org-id'];
      const devRole = request.headers['x-dev-role'];
      const devTeamId = request.headers['x-dev-team-id'];

      if (devUserId && !Array.isArray(devUserId) && devOrgId && !Array.isArray(devOrgId)) {
        const roleValue = Array.isArray(devRole) ? devRole[0] : devRole;
        request.authUser = {
          id: devUserId,
          organizationId: devOrgId,
          role:
            roleValue === 'admin' || roleValue === 'manager' || roleValue === 'employee'
              ? roleValue
              : 'manager',
          teamId: Array.isArray(devTeamId) ? devTeamId[0] : devTeamId,
        };
        return true;
      }
    }

    if (!authHeader || Array.isArray(authHeader)) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Authorization header must be a Bearer token');
    }

    const claims = await this.clerkJwtService.verifyToken(token);
    request.authUser = this.clerkJwtService.toAuthUser(claims);

    return true;
  }
}
