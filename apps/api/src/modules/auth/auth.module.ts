import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkJwtService } from './clerk-jwt.service';
import { ClerkAuthGuard } from './guards/clerk-auth.guard';
import { RbacGuard } from './guards/rbac.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, ClerkJwtService, ClerkAuthGuard, RbacGuard],
  exports: [ClerkAuthGuard, RbacGuard],
})
export class AuthModule {}
