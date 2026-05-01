import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import type { JWTPayload } from 'jose';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { AuthRole, AuthUser } from '../common/auth-user.interface';

@Injectable()
export class ClerkJwtService {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  async verifyToken(token: string): Promise<JWTPayload> {
    const issuer = this.getIssuer();

    try {
      const { payload } = await jwtVerify(token, this.getJwks(), { issuer });
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired Clerk JWT');
    }
  }

  toAuthUser(claims: JWTPayload): AuthUser {
    const userId = claims.sub;
    const organizationId = this.readStringClaim(claims, 'org_id');

    if (!userId || !organizationId) {
      throw new UnauthorizedException('Required Clerk claims missing (sub/org_id)');
    }

    return {
      id: userId,
      email: this.readStringClaim(claims, 'email'),
      role: this.mapRole(claims),
      organizationId,
      teamId: this.readStringClaim(claims, 'team_id'),
    };
  }

  private getIssuer(): string {
    const issuer = process.env.CLERK_JWT_ISSUER?.trim();
    if (!issuer) {
      throw new InternalServerErrorException('CLERK_JWT_ISSUER is not configured');
    }
    return issuer;
  }

  private getJwks() {
    if (!this.jwks) {
      const issuer = this.getIssuer();
      const base = issuer.endsWith('/') ? issuer : `${issuer}/`;
      this.jwks = createRemoteJWKSet(new URL('.well-known/jwks.json', base));
    }
    return this.jwks;
  }

  private mapRole(claims: JWTPayload): AuthRole {
    const orgRole = this.readStringClaim(claims, 'org_role') ?? this.readStringClaim(claims, 'role');

    if (!orgRole) {
      return 'employee';
    }

    const normalized = orgRole.toLowerCase().replace('org:', '');
    if (normalized === 'admin') {
      return 'admin';
    }
    if (normalized === 'manager') {
      return 'manager';
    }

    return 'employee';
  }

  private readStringClaim(claims: JWTPayload, claim: string): string | undefined {
    const value = claims[claim];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
