import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private rbacService: RbacService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') as string,
    });
  }

  async validate(payload: any) {
    let permissions = payload.permissions || [];
    
    // Fetch live permissions if we have a valid tenantId and userId
    if (payload.tenantId && payload.id) {
      try {
        const livePerms = await this.rbacService.getUserPermissions(payload.tenantId, payload.id);
        if (livePerms.length > 0 || payload.role !== 'Super Admin') {
          permissions = livePerms;
        }
      } catch (err) {
        // Fallback to payload permissions if DB lookup fails
      }
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      tenantId: payload.tenantId,
      role: payload.role,
      userType: payload.userType,
      projectId: payload.projectId,
      projectName: payload.projectName,
      phone: payload.phone,
      permissions,
    };
  }
}

