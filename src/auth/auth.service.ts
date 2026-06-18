import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../schemas/admin.schema';
import { User } from '../schemas/rbac/user.schema';
import { Project } from '../schemas/project.schema';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Project.name) private projectModel: Model<Project>,
    private rbacService: RbacService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    // 1. Check User model
    let user = await this.userModel.findOne({ email });
    if (user && user.password) {
      if (await bcrypt.compare(pass, user.password)) {
        const roles = await this.rbacService.getUserRoles(String(user.tenantId), String(user._id));
        const permissions = await this.rbacService.getUserPermissions(String(user.tenantId), String(user._id));
        
        let projectName: string | null = null;
        if (user.projectId) {
          const project = await this.projectModel.findById(user.projectId);
          if (project) projectName = project.projectName;
        }

        return {
          id: user._id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: roles[0]?.name || 'Employee',
          userType: user.userType,
          projectId: user.projectId,
          projectName,
          permissions,
          phone: user.phone,
        };
      }
    }

    // 2. Check Admin model fallback
    const admin = await this.adminModel.findOne({ email });
    if (admin && admin.password) {
      if (await bcrypt.compare(pass, admin.password)) {
        // Find default tenant for fallback
        return {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          tenantId: new Types.ObjectId('60d5ecb8b39d1b2ab8f9df01'), // Default seeded tenant ID
          role: 'Super Admin',
          userType: 'admin',
          permissions: [], // Admins have hardcoded global access in older logic
          phone: admin.phone,
        };
      }
    }

    return null;
  }

  async login(email: string, pass: string) {
    const user = await this.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: String(user.tenantId),
      role: user.role,
      userType: user.userType,
      projectId: user.projectId ? String(user.projectId) : undefined,
      projectName: user.projectName,
      permissions: user.permissions,
    };

    return {
      message: 'Login success',
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        userType: user.userType,
        projectId: user.projectId,
        projectName: user.projectName,
      },
    };
  }

  async verify(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      let permissions = decoded.permissions || [];
      
      if (decoded.tenantId && decoded.id) {
        try {
          const livePerms = await this.rbacService.getUserPermissions(decoded.tenantId, decoded.id);
          if (livePerms.length > 0 || decoded.role !== 'Super Admin') {
            permissions = livePerms;
          }
        } catch (e) {
          // Fallback to token permissions
        }
      }

      return {
        message: 'Valid',
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        userType: decoded.userType,
        tenantId: decoded.tenantId,
        projectId: decoded.projectId,
        projectName: decoded.projectName,
        permissions,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

