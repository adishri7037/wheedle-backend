import { Controller, Get, Post, Put, Patch, Body, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/rbac.decorator';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @RequirePermission('tasks', 'tasks.create')
  @Post()
  async createProject(@Req() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Invalid user context');
    return this.projectsService.createProject(String(tenantId), body);
  }

  @RequirePermission('tasks', 'tasks.view')
  @Get()
  async getProjects(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Invalid user context');
    return this.projectsService.getProjects(String(tenantId));
  }

  @RequirePermission('tasks', 'tasks.view')
  @Get(':id')
  async getProjectById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Invalid user context');
    return this.projectsService.getProjectById(String(tenantId), id);
  }

  @RequirePermission('tasks', 'tasks.edit')
  @Put(':id')
  async updateProject(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Invalid user context');
    return this.projectsService.updateProject(String(tenantId), id, body);
  }

  @RequirePermission('tasks', 'tasks.delete')
  @Patch(':id/archive')
  async archiveProject(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Invalid user context');
    return this.projectsService.archiveProject(String(tenantId), id);
  }
}
