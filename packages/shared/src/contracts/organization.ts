import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { z } from 'zod';

export const membershipRoleSchema = z.enum(['admin', 'manager', 'employee']);

export const organizationMemberSchema = z.object({
  organizationId: z.string().uuid(),
  teamId: z.string().uuid().nullable(),
  userId: z.string().uuid(),
  role: membershipRoleSchema,
});

export type MembershipRole = z.infer<typeof membershipRoleSchema>;
export type OrganizationMember = z.infer<typeof organizationMemberSchema>;

export class AddMembershipDto {
  @IsUUID()
  organizationId!: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;

  @IsUUID()
  userId!: string;

  @IsEnum(['admin', 'manager', 'employee'])
  role!: MembershipRole;
}

export class InviteUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Length(1, 120)
  displayName!: string;

  @IsOptional()
  @IsUUID()
  teamId?: string;
}
