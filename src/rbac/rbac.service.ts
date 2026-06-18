import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../schemas/rbac/tenant.schema';
import { User } from '../schemas/rbac/user.schema';
import { Role } from '../schemas/rbac/role.schema';
import { Permission } from '../schemas/rbac/permission.schema';
import { RolePermission } from '../schemas/rbac/role-permission.schema';
import { UserRole } from '../schemas/rbac/user-role.schema';
import { EmailService } from '../email/email.service';

const permissionCache = new Map<string, boolean>();

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<Tenant>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
    @InjectModel(Permission.name) private permissionModel: Model<Permission>,
    @InjectModel(RolePermission.name) private rolePermissionModel: Model<RolePermission>,
    @InjectModel(UserRole.name) private userRoleModel: Model<UserRole>,
    private emailService: EmailService,
  ) {}

  async onModuleInit() {
    console.log('[RBAC] Checking database for seeding...');
    try {
      let tenant = await this.tenantModel.findOne();
      if (!tenant) {
        tenant = await this.tenantModel.create({
          key: 'default',
          name: 'Wheedle Technologies',
        });
        console.log('[RBAC] Created default tenant:', tenant.name);
      }

      const tenantId = tenant._id as Types.ObjectId;

      // Seed Roles
      const roleNames = ['Super Admin', 'Admin', 'Team Lead', 'Employee', 'Client'] as const;
      const rolesMap: Record<string, Role> = {};
      for (const name of roleNames) {
        let role = await this.roleModel.findOne({ tenantId, name });
        if (!role) {
          role = await this.roleModel.create({
            tenantId,
            name,
            createdByUserId: new Types.ObjectId('000000000000000000000000'), // System created
          });
          console.log(`[RBAC] Seeded role: ${name}`);
        }
        rolesMap[name] = role;
      }

      // Seed Permissions
      const permissionSpecs = [
        // Tasks
        { moduleKey: 'tasks', permissionKey: 'tasks.view' },
        { moduleKey: 'tasks', permissionKey: 'tasks.create' },
        { moduleKey: 'tasks', permissionKey: 'tasks.edit' },
        { moduleKey: 'tasks', permissionKey: 'tasks.delete' },
        { moduleKey: 'tasks', permissionKey: 'tasks.updateStatus' },
        // Client Queries
        { moduleKey: 'client-queries', permissionKey: 'queries.create' },
        { moduleKey: 'client-queries', permissionKey: 'queries.view' },
        { moduleKey: 'client-queries', permissionKey: 'queries.assign' },
        { moduleKey: 'client-queries', permissionKey: 'queries.update' },
        { moduleKey: 'client-queries', permissionKey: 'queries.internalNotes' },
        // Reports
        { moduleKey: 'reports', permissionKey: 'reports.view' },
        // User management
        { moduleKey: 'user-management', permissionKey: 'users.view' },
        { moduleKey: 'user-management', permissionKey: 'users.manage' },
        { moduleKey: 'user-management', permissionKey: 'roles.manage' },
        // Content Management
        { moduleKey: 'content', permissionKey: 'hero.view' },
        { moduleKey: 'content', permissionKey: 'partners.view' },
        { moduleKey: 'content', permissionKey: 'steps.view' },
        { moduleKey: 'content', permissionKey: 'jobs.view' },
        { moduleKey: 'content', permissionKey: 'blogs.view' },
        { moduleKey: 'content', permissionKey: 'testimonials.view' },
        // CRM
        { moduleKey: 'crm', permissionKey: 'applications.view' },
        { moduleKey: 'crm', permissionKey: 'leads.view' },
        { moduleKey: 'crm', permissionKey: 'formleads.view' },
        // Live Chat
        { moduleKey: 'live-chat', permissionKey: 'livechat.view' },
      ];

      const permsMap: Record<string, Permission> = {};
      for (const spec of permissionSpecs) {
        const key = `${spec.moduleKey}:${spec.permissionKey}`;
        let perm = await this.permissionModel.findOne({ tenantId, moduleKey: spec.moduleKey, permissionKey: spec.permissionKey });
        if (!perm) {
          perm = await this.permissionModel.create({
            tenantId,
            moduleKey: spec.moduleKey,
            permissionKey: spec.permissionKey,
          });
          console.log(`[RBAC] Seeded permission: ${key}`);
        }
        permsMap[key] = perm;
      }

      // Map roles to permissions
      const rolePermissionsMapping: Record<string, string[]> = {
        'Super Admin': permissionSpecs.map(p => `${p.moduleKey}:${p.permissionKey}`),
        'Admin': permissionSpecs.map(p => `${p.moduleKey}:${p.permissionKey}`),
        'Team Lead': [
          'tasks:tasks.view', 'tasks:tasks.create', 'tasks:tasks.edit', 'tasks:tasks.updateStatus',
          'client-queries:queries.view', 'client-queries:queries.assign', 'client-queries:queries.update', 'client-queries:queries.internalNotes',
          'reports:reports.view', 'user-management:users.view'
        ],
        'Employee': [
          'tasks:tasks.view', 'tasks:tasks.updateStatus',
          'client-queries:queries.view', 'client-queries:queries.internalNotes'
        ],
        'Client': [
          'client-queries:queries.create', 'client-queries:queries.view'
        ],
      };

      for (const [roleName, permKeys] of Object.entries(rolePermissionsMapping)) {
        const role = rolesMap[roleName];
        if (!role) continue;

        // Check if role permissions are mapped
        const existingMappingsCount = await this.rolePermissionModel.countDocuments({ tenantId, roleId: role._id });
        if (existingMappingsCount === 0) {
          const docs = permKeys.map(k => {
            const p = permsMap[k];
            return {
              tenantId,
              roleId: role._id,
              permissionId: p._id,
            };
          });
          await this.rolePermissionModel.insertMany(docs);
          console.log(`[RBAC] Mapped permissions to role: ${roleName}`);
        }
      }

      // Seed Super Admin user
      let adminUser = await this.userModel.findOne({ email: 'admin@wheedle.com' });
      if (!adminUser) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        adminUser = await this.userModel.create({
          tenantId,
          email: 'admin@wheedle.com',
          name: 'Super Admin',
          userType: 'admin',
          password: hashedPassword,
        });
        console.log(`[RBAC] Seeded Super Admin user (admin@wheedle.com)`);

        // Map user to Super Admin role
        const role = rolesMap['Super Admin'];
        await this.userRoleModel.create({
          tenantId,
          userId: adminUser._id,
          roleId: role._id,
        });
        console.log(`[RBAC] Associated admin@wheedle.com to Super Admin role`);
      }
    } catch (err) {
      console.error('[RBAC] Error seeding database:', err);
    }
  }

  private cacheKey(args: {
    tenantId: string;
    userId: string;
    moduleKey: string;
    permissionKey: string;
  }) {
    return `${args.tenantId}:${args.userId}:${args.moduleKey}:${args.permissionKey}`;
  }

  async getUserRoles(tenantId: string, userId: string): Promise<Role[]> {
    const userRoles = await this.userRoleModel
      .find({ tenantId: new Types.ObjectId(tenantId), userId: new Types.ObjectId(userId) })
      .lean();
    if (!userRoles?.length) return [];
    return this.roleModel.find({ _id: { $in: userRoles.map((ur) => ur.roleId) } }).lean();
  }

  async getUserPermissions(tenantId: string, userId: string): Promise<string[]> {
    const roles = await this.getUserRoles(tenantId, userId);
    if (!roles?.length) return [];

    const isSuperAdmin = roles.some((r) => r.name === 'Super Admin');
    if (isSuperAdmin) {
      const allPerms = await this.permissionModel.find({ tenantId: new Types.ObjectId(tenantId) }).lean();
      return allPerms.map((p) => `${p.moduleKey}:${p.permissionKey}`);
    }

    const roleIds = roles.map((r) => r._id);
    const rolePermissions = await this.rolePermissionModel
      .find({ tenantId: new Types.ObjectId(tenantId), roleId: { $in: roleIds } })
      .lean();
    if (!rolePermissions?.length) return [];

    const perms = await this.permissionModel
      .find({ _id: { $in: rolePermissions.map((rp) => rp.permissionId) } })
      .lean();
    return perms.map((p) => `${p.moduleKey}:${p.permissionKey}`);
  }

  async can({
    tenantId,
    userId,
    moduleKey,
    permissionKey,
  }: {
    tenantId: string;
    userId: string;
    moduleKey: string;
    permissionKey: string;
  }): Promise<boolean> {
    const key = this.cacheKey({ tenantId, userId, moduleKey, permissionKey });
    const cached = permissionCache.get(key);
    if (typeof cached === 'boolean') return cached;

    const userRoles = await this.userRoleModel
      .find({ tenantId: new Types.ObjectId(tenantId), userId: new Types.ObjectId(userId) })
      .select('roleId')
      .lean();

    if (!userRoles?.length) {
      permissionCache.set(key, false);
      return false;
    }

    const permission = await this.permissionModel
      .findOne({
        tenantId: new Types.ObjectId(tenantId),
        moduleKey,
        permissionKey,
      })
      .select('_id')
      .lean();

    if (!permission) {
      permissionCache.set(key, false);
      return false;
    }

    const allowed = await this.rolePermissionModel.exists({
      tenantId: new Types.ObjectId(tenantId),
      roleId: { $in: userRoles.map((r: any) => r.roleId) },
      permissionId: permission._id,
    });

    const result = !!allowed;
    permissionCache.set(key, result);
    return result;
  }

  clearCacheForTenant(tenantId: string) {
    for (const key of permissionCache.keys()) {
      if (key.startsWith(`${tenantId}:`)) permissionCache.delete(key);
    }
  }

  async getRoles(tenantId: string): Promise<Role[]> {
    return this.roleModel.find({ tenantId: new Types.ObjectId(tenantId) }).lean();
  }

  async getPermissions(tenantId: string): Promise<Permission[]> {
    return this.permissionModel.find({ tenantId: new Types.ObjectId(tenantId) }).lean();
  }

  async getRolePermissionsMapping(tenantId: string, roleId: string): Promise<Types.ObjectId[]> {
    const mappings = await this.rolePermissionModel
      .find({ tenantId: new Types.ObjectId(tenantId), roleId: new Types.ObjectId(roleId) })
      .select('permissionId')
      .lean();
    return mappings.map((m) => m.permissionId);
  }

  async getUsers(tenantId: string) {
    const users = await this.userModel.find({ tenantId: new Types.ObjectId(tenantId) }).lean();
    const populatedUsers: any[] = [];

    for (const u of users) {
      const roles = await this.getUserRoles(tenantId, String(u._id));
      const { password, ...userWithoutPassword } = u;
      populatedUsers.push({
        ...userWithoutPassword,
        role: roles[0]?.name || 'Employee',
        roleId: roles[0]?._id || null,
        projectId: u.projectId || null,
      });
    }
    return populatedUsers;
  }

  async createUser(tenantId: string, payload: any) {
    const { email, password, name, userType, roleId, projectId } = payload;
    
    if (userType === 'client' && !projectId) {
      throw new BadRequestException('Client users must be assigned to a project (projectId is required)');
    }

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const user = await this.userModel.create({
      tenantId: new Types.ObjectId(tenantId),
      email,
      name,
      userType: userType || 'employee',
      projectId: projectId ? new Types.ObjectId(projectId) : undefined,
      password: hashedPassword,
    });

    if (roleId) {
      await this.userRoleModel.create({
        tenantId: new Types.ObjectId(tenantId),
        userId: user._id,
        roleId: new Types.ObjectId(roleId),
      });
    }

    if (userType === 'client') {
      await this.emailService.sendClientOnboardingEmail(email, password || 'password123');
    }

    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async updateUser(tenantId: string, userId: string, payload: any) {
    const { name, email, userType, roleId, password, projectId } = payload;
    
    if (userType === 'client' && !projectId) {
      throw new BadRequestException('Client users must be assigned to a project (projectId is required)');
    }

    const updateData: any = { name, email, userType };
    if (projectId) {
      updateData.projectId = new Types.ObjectId(projectId);
    }
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const user = await this.userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(userId), tenantId: new Types.ObjectId(tenantId) },
      { $set: updateData },
      { new: true }
    );
    if (!user) throw new BadRequestException('User not found');

    if (roleId) {
      await this.userRoleModel.deleteMany({
        tenantId: new Types.ObjectId(tenantId),
        userId: user._id,
      });
      await this.userRoleModel.create({
        tenantId: new Types.ObjectId(tenantId),
        userId: user._id,
        roleId: new Types.ObjectId(roleId),
      });
    }
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  }

  async deleteUser(tenantId: string, userId: string) {
    await this.userModel.deleteOne({ _id: new Types.ObjectId(userId), tenantId: new Types.ObjectId(tenantId) });
    await this.userRoleModel.deleteMany({ tenantId: new Types.ObjectId(tenantId), userId: new Types.ObjectId(userId) });
    this.clearCacheForTenant(tenantId);
    return { message: 'User deleted successfully' };
  }

  async assignPermissionsToRole({
    tenantId,
    roleId,
    permissionSpecs,
  }: {
    tenantId: string;
    roleId: string;
    permissionSpecs: Array<{ moduleKey: string; permissionKey: string }>;
  }) {
    if (!permissionSpecs?.length) {
      throw new BadRequestException('permissionSpecs cannot be empty');
    }

    await this.rolePermissionModel.deleteMany({
      tenantId: new Types.ObjectId(tenantId),
      roleId: new Types.ObjectId(roleId),
    });

    const permissionDocs = await Promise.all(
      permissionSpecs.map((spec) =>
        this.permissionModel.findOneAndUpdate(
          {
            tenantId: new Types.ObjectId(tenantId),
            moduleKey: spec.moduleKey,
            permissionKey: spec.permissionKey,
          },
          {
            $setOnInsert: {
              tenantId: new Types.ObjectId(tenantId),
              moduleKey: spec.moduleKey,
              permissionKey: spec.permissionKey,
            },
          },
          { upsert: true, new: true },
        ),
      ),
    );

    const docs = permissionDocs.filter(Boolean) as Array<{ _id: Types.ObjectId }>;

    await this.rolePermissionModel.insertMany(
      docs.map((p) => ({
        tenantId: new Types.ObjectId(tenantId),
        roleId: new Types.ObjectId(roleId),
        permissionId: p._id,
      })),
    );

    this.clearCacheForTenant(tenantId);
    return { message: 'Permissions updated' };
  }
}
