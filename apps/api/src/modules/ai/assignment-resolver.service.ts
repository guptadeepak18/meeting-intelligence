import { Injectable } from '@nestjs/common';

export interface CandidateUser {
  id: string;
  email: string;
  displayName: string;
}

@Injectable()
export class AssignmentResolverService {
  resolveOwner(ownerCandidate: string | null | undefined, users: CandidateUser[]): string | null {
    if (!ownerCandidate) {
      return null;
    }

    const normalized = ownerCandidate.trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    const exactEmail = users.find((user) => user.email.toLowerCase() === normalized);
    if (exactEmail) {
      return exactEmail.id;
    }

    const exactName = users.find((user) => user.displayName.toLowerCase() === normalized);
    if (exactName) {
      return exactName.id;
    }

    const fuzzy = users.find(
      (user) =>
        user.displayName.toLowerCase().includes(normalized) ||
        normalized.includes(user.displayName.toLowerCase()),
    );

    return fuzzy?.id ?? null;
  }
}
