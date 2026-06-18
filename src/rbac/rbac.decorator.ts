import { SetMetadata } from '@nestjs/common';
import { RBAC_META, RbacMeta } from './rbac.types';

export function RequirePermission(moduleKey: string, permissionKey: string) {
  return SetMetadata(RBAC_META, { moduleKey, permissionKey } satisfies RbacMeta);
}

