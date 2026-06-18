import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/rbac.decorator';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @RequirePermission('tasks', 'tasks.create')
  @Post()
  async createTask(@Req() req: any, @Body() body: any) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.tasksService.createTask(String(tenantId), String(userId), body);
  }

  @RequirePermission('tasks', 'tasks.view')
  @Get()
  async getTasks(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignee') assignee?: string,
    @Query('projectId') projectId?: string,
    @Query('search') search?: string
  ) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    const userId = req.user?.id;
    if (!tenantId || !role || !userId) {
      throw new BadRequestException('Invalid user context');
    }

    const effectiveProjectId = role === 'Client' ? req.user.projectId : projectId;

    return this.tasksService.getTasks(String(tenantId), String(role), String(userId), effectiveProjectId, {
      status,
      priority,
      assignee,
      search,
    });
  }

  @RequirePermission('tasks', 'tasks.view')
  @Get('calendar')
  async getWeeklyCalendar(@Req() req: any, @Query('startOfWeek') startOfWeek: string) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    const userId = req.user?.id;
    if (!tenantId || !role || !userId) {
      throw new BadRequestException('Invalid user context');
    }
    if (!startOfWeek) {
      throw new BadRequestException('Missing startOfWeek date query parameter');
    }

    const effectiveProjectId = role === 'Client' ? req.user.projectId : req.query.projectId;

    return this.tasksService.getWeeklyCalendar(String(tenantId), String(role), String(userId), effectiveProjectId, startOfWeek);
  }

  @RequirePermission('tasks', 'tasks.view')
  @Get(':id')
  async getTaskById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.tasksService.getTaskById(String(tenantId), id);
  }

  @RequirePermission('tasks', 'tasks.edit')
  @Put(':id')
  async updateTask(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.tasksService.updateTask(String(tenantId), id, body);
  }

  @RequirePermission('tasks', 'tasks.updateStatus')
  @Patch(':id/status')
  async updateTaskStatus(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!tenantId || !userId || !role) {
      throw new BadRequestException('Invalid user context');
    }
    return this.tasksService.updateTaskStatus(String(tenantId), String(userId), String(role), id, body);
  }

  @RequirePermission('tasks', 'tasks.edit')
  @Patch(':id/calendar-assign')
  async calendarAssign(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.tasksService.calendarAssign(String(tenantId), id, body);
  }

  @RequirePermission('tasks', 'tasks.delete')
  @Delete(':id')
  async deleteTask(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.tasksService.deleteTask(String(tenantId), id);
  }
}
