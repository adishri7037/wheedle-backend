import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RbacService } from './rbac.service';
import { RbacGuard } from './rbac.guard';
import { RolesController } from './roles.controller';
import { Tenant, TenantSchema } from '../schemas/rbac/tenant.schema';
import { User, UserSchema } from '../schemas/rbac/user.schema';
import { Role, RoleSchema } from '../schemas/rbac/role.schema';
import { Permission, PermissionSchema } from '../schemas/rbac/permission.schema';
import { RolePermission, RolePermissionSchema } from '../schemas/rbac/role-permission.schema';
import { UserRole, UserRoleSchema } from '../schemas/rbac/user-role.schema';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: UserRole.name, schema: UserRoleSchema },
    ]),
    EmailModule,
  ],
  controllers: [RolesController],
  providers: [RbacService, RbacGuard],
  exports: [RbacService],
})
export class RbacModule {}

