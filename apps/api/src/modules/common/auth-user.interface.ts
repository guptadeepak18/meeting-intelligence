export type AuthRole = 'admin' | 'manager' | 'employee';

export interface AuthUser {
  id: string;
  email?: string;
  role: AuthRole;
  organizationId: string;
  teamId?: string;
}

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  authUser?: AuthUser;
}
