import { Body, Controller, Param, Post, Get, Put, Delete, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from './rbac.guard';
import { RequirePermission } from './rbac.decorator';
import { RbacService } from './rbac.service';

@Controller('rbac')
@UseGuards(JwtAuthGuard, RbacGuard)
export class RolesController {
  constructor(private rbacService: RbacService) {}

  @RequirePermission('user-management', 'roles.manage')
  @Get('roles')
  async getRoles(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    return this.rbacService.getRoles(String(tenantId));
  }

  @RequirePermission('user-management', 'roles.manage')
  @Get('permissions')
  async getPermissions(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    return this.rbacService.getPermissions(String(tenantId));
  }

  @RequirePermission('user-management', 'roles.manage')
  @Get('roles/:roleId/permissions')
  async getRolePermissions(@Param('roleId') roleId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    return this.rbacService.getRolePermissionsMapping(String(tenantId), roleId);
  }

  @RequirePermission('user-management', 'roles.manage')
  @Post('roles/:roleId/permissions')
  async assignRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: { permissionSpecs: Array<{ moduleKey: string; permissionKey: string }> },
    @Req() req: any,
  ) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');

    return this.rbacService.assignPermissionsToRole({
      tenantId: String(tenantId),
      roleId,
      permissionSpecs: body.permissionSpecs,
    });
  }

  // --- USER MANAGEMENT ENDPOINTS ---

  @RequirePermission('user-management', 'users.view')
  @Get('users')
  async getUsers(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    return this.rbacService.getUsers(String(tenantId));
  }

  // Used by task/calendar/queries assignment dropdowns
  @Get('team-members')
  async getTeamMembers(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    const users = await this.rbacService.getUsers(String(tenantId));
    return users.filter(u => u.userType !== 'client');
  }

  @RequirePermission('user-management', 'users.manage')
  @Post('users')
  async createUser(@Body() body: any, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    return this.rbacService.createUser(String(tenantId), body);
  }

  @RequirePermission('user-management', 'users.manage')
  @Put('users/:userId')
  async updateUser(@Param('userId') userId: string, @Body() body: any, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    return this.rbacService.updateUser(String(tenantId), userId, body);
  }

  @RequirePermission('user-management', 'users.manage')
  @Delete('users/:userId')
  async deleteUser(@Param('userId') userId: string, @Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Missing tenantId');
    return this.rbacService.deleteUser(String(tenantId), userId);
  }
}
