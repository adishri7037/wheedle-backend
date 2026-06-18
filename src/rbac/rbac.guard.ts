import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './rbac.service';
import { RBAC_META } from './rbac.types';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector, private rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<{ moduleKey: string; permissionKey: string }>(
      RBAC_META,
      [context.getHandler(), context.getClass()],
    );

    if (!meta) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const tenantId = req.headers['x-tenant-id'] || req.tenantId || user?.tenantId;
    const userId = user?.id || user?._id;

    if (user?.role === 'Super Admin' || user?.role === 'Admin') return true;

    if (!tenantId || !userId) return false;

    return this.rbacService.can({
      tenantId: String(tenantId),
      userId: String(userId),
      moduleKey: meta.moduleKey,
      permissionKey: meta.permissionKey,
    });
  }
}

