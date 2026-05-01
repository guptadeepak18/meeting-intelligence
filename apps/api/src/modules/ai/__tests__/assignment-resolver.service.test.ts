import { describe, expect, it } from 'vitest';
import { AssignmentResolverService } from '../assignment-resolver.service';

describe('AssignmentResolverService', () => {
  const resolver = new AssignmentResolverService();
  const users = [
    { id: 'u1', email: 'manager@hyperbuild.dev', displayName: 'Avery Manager' },
    { id: 'u2', email: 'employee@hyperbuild.dev', displayName: 'Jordan Employee' },
  ];

  it('resolves by exact email', () => {
    expect(resolver.resolveOwner('employee@hyperbuild.dev', users)).toBe('u2');
  });

  it('resolves by display name', () => {
    expect(resolver.resolveOwner('Avery Manager', users)).toBe('u1');
  });

  it('returns null when no owner candidate matches', () => {
    expect(resolver.resolveOwner('Unknown Person', users)).toBeNull();
  });
});
