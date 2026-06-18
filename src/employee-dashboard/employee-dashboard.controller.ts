import { Controller, Get, Patch, Param, Query, Req, UseGuards, BadRequestException, Res } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/rbac.decorator';
import { EmployeeDashboardService } from './employee-dashboard.service';

@Controller()
@UseGuards(JwtAuthGuard, RbacGuard)
export class EmployeeDashboardController {
  constructor(private dashboardService: EmployeeDashboardService) {}

  @RequirePermission('tasks', 'tasks.view')
  @Get('dashboard/employee-task/widgets')
  async getWidgets(@Req() req: any, @Query('projectId') projectId?: string) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    const userId = req.user?.id;
    if (!tenantId || !role || !userId) {
      throw new BadRequestException('Invalid user context');
    }
    const effectiveProjectId = role === 'Client' ? req.user.projectId : projectId;
    return this.dashboardService.getDashboardWidgets(String(tenantId), String(role), String(userId), effectiveProjectId);
  }

  @RequirePermission('tasks', 'tasks.view')
  @Get('dashboard/employee-task/analytics')
  async getAnalytics(@Req() req: any, @Query('projectId') projectId?: string) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    const effectiveProjectId = role === 'Client' ? req.user.projectId : projectId;
    return this.dashboardService.getDashboardAnalytics(String(tenantId), effectiveProjectId);
  }

  @RequirePermission('reports', 'reports.view')
  @Get('dashboard/employee-task/reports')
  async getReports(@Req() req: any, @Query('startDate') startDate: string, @Query('timeframe') timeframe: string, @Query('projectId') projectId?: string) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    if (!startDate || !timeframe) {
      throw new BadRequestException('Missing startDate or timeframe query parameter');
    }
    const effectiveProjectId = role === 'Client' ? req.user.projectId : projectId;
    return this.dashboardService.getReport(String(tenantId), startDate, timeframe, effectiveProjectId);
  }

  @RequirePermission('reports', 'reports.view')
  @Get('dashboard/employee-task/reports/export')
  async exportReports(
    @Req() req: any,
    @Query('startDate') startDate: string,
    @Query('timeframe') timeframe: string,
    @Res() res: any,
    @Query('projectId') projectId?: string
  ) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    if (!tenantId) {
      throw new BadRequestException('Invalid user context');
    }
    if (!startDate || !timeframe) {
      throw new BadRequestException('Missing startDate or timeframe query parameter');
    }
    const effectiveProjectId = role === 'Client' ? req.user.projectId : projectId;
    const csvContent = await this.dashboardService.exportReportCSV(String(tenantId), startDate, timeframe, effectiveProjectId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${timeframe}-report-${startDate}.csv`);
    return res.status(200).send(csvContent);
  }

  @Get('dashboard/employee-task/overview')
  async getOverview(@Req() req: any, @Query('projectId') projectId?: string) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;
    const userId = req.user?.id;
    if (!tenantId || !role || !userId) {
      throw new BadRequestException('Invalid user context');
    }
    const effectiveProjectId = role === 'Client' ? req.user.projectId : projectId;
    return this.dashboardService.getOverviewStats(String(tenantId), String(role), String(userId), effectiveProjectId);
  }

  @Get('dashboard/employee-task/notifications')
  async getNotifications(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.dashboardService.getNotifications(String(tenantId), String(userId));
  }

  @Patch('dashboard/employee-task/notifications/:id/read')
  async readNotification(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.dashboardService.markNotificationRead(String(tenantId), id, String(userId));
  }

  @Patch('dashboard/employee-task/notifications/mark-all-read')
  async markAllNotificationsRead(@Req() req: any) {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    if (!tenantId || !userId) {
      throw new BadRequestException('Invalid user context');
    }
    return this.dashboardService.markAllNotificationsRead(String(tenantId), String(userId));
  }
}
