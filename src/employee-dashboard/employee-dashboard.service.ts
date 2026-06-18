import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../schemas/task.schema';
import { ClientQuery } from '../schemas/client-query.schema';
import { User } from '../schemas/rbac/user.schema';
import { Notification } from '../schemas/notification.schema';

@Injectable()
export class EmployeeDashboardService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(ClientQuery.name) private clientQueryModel: Model<ClientQuery>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  async getDashboardWidgets(tenantId: string, role: string, userId: string, projectId: string | undefined): Promise<any> {
    const tId = new Types.ObjectId(tenantId);
    const uId = new Types.ObjectId(userId);

    // 1. Task Overview (filter by assignee if Employee)
    const taskQuery: any = { tenantId: tId };
    
    if (role === 'Client') {
      if (!projectId) return this.emptyWidgets();
      taskQuery.projectId = new Types.ObjectId(projectId);
    } else {
      if (projectId) taskQuery.projectId = new Types.ObjectId(projectId);
      if (role === 'Employee') taskQuery.assignees = uId;
    }

    const tasks = await this.taskModel.find(taskQuery).exec();
    const taskOverview = {
      total: tasks.length,
      notStarted: tasks.filter((t) => t.status === 'Not Started').length,
      inProgress: tasks.filter((t) => t.status === 'In Progress').length,
      underReview: tasks.filter((t) => t.status === 'Under Review').length,
      completed: tasks.filter((t) => t.status === 'Completed').length,
      blocked: tasks.filter((t) => t.status === 'Blocked').length,
      highPriority: tasks.filter((t) => t.priority === 'High').length,
    };

    // 2. Employee Performance (Admins/Team Leads see this)
    let employeePerformance: any[] = [];
    if (role !== 'Employee' && role !== 'Client') {
      const employees = await this.userModel.find({ tenantId: tId, userType: { $ne: 'client' } }).lean();
      for (const emp of employees) {
        const empTasks = await this.taskModel.find({ tenantId: tId, assignees: emp._id }).exec();
        const total = empTasks.length;
        const completed = empTasks.filter((t) => t.status === 'Completed').length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const avgProgress = total > 0 ? Math.round(empTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / total) : 0;
        employeePerformance.push({
          id: emp._id,
          name: emp.name,
          email: emp.email,
          userType: emp.userType,
          totalTasks: total,
          completedTasks: completed,
          completionRate,
          avgProgress,
        });
      }
    }

    // 3. Client Query Overview
    const queryQuery: any = { tenantId: tId };
    if (role === 'Client') {
      if (projectId) queryQuery.projectId = new Types.ObjectId(projectId);
      queryQuery.client = uId;
    } else {
      if (projectId) queryQuery.projectId = new Types.ObjectId(projectId);
      if (role === 'Employee') queryQuery.assignedTo = uId;
    }

    const queries = await this.clientQueryModel.find(queryQuery).exec();
    const resolvedQueries = queries.filter((q) => q.status === 'Resolved' || q.status === 'Closed');
    const avgResolutionTime =
      resolvedQueries.length > 0
        ? Math.round((resolvedQueries.reduce((sum, q) => sum + (q.resolutionTime || 0), 0) / resolvedQueries.length) * 10) / 10
        : 0;

    const queryOverview = {
      total: queries.length,
      open: queries.filter((q) => q.status === 'Open').length,
      assigned: queries.filter((q) => q.status === 'Assigned').length,
      inProgress: queries.filter((q) => q.status === 'In Progress').length,
      waitingForClient: queries.filter((q) => q.status === 'Waiting for Client').length,
      resolved: queries.filter((q) => q.status === 'Resolved').length,
      closed: queries.filter((q) => q.status === 'Closed').length,
      avgResolutionTime,
    };

    // 4. Calendar Overview (Mon-Sun tasks for current week)
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const calendarQuery: any = {
      tenantId: tId,
      calendarDate: { $gte: startOfWeek, $lt: endOfWeek },
    };
    if (role === 'Client') {
      if (projectId) calendarQuery.projectId = new Types.ObjectId(projectId);
    } else {
      if (projectId) calendarQuery.projectId = new Types.ObjectId(projectId);
      if (role === 'Employee') calendarQuery.assignees = uId;
    }
    const calendarTasks = await this.taskModel.find(calendarQuery).select('title priority status calendarDate').exec();

    // 5. Notifications (unread limit 5)
    const notifications = await this.notificationModel
      .find({ tenantId: tId, userId: uId, isRead: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    return {
      taskOverview,
      employeePerformance,
      queryOverview,
      calendarTasks,
      notifications,
    };
  }

  private emptyWidgets() {
    return {
      taskOverview: { total: 0, notStarted: 0, inProgress: 0, underReview: 0, completed: 0, blocked: 0, highPriority: 0 },
      employeePerformance: [],
      queryOverview: { total: 0, open: 0, assigned: 0, inProgress: 0, waitingForClient: 0, resolved: 0, closed: 0, avgResolutionTime: 0 },
      calendarTasks: [],
      notifications: [],
    };
  }

  async getDashboardAnalytics(tenantId: string, projectId: string | undefined): Promise<any> {
    const tId = new Types.ObjectId(tenantId);
    const dataDays: string[] = [];
    const taskCompletedData: number[] = [];
    const queryResolvedData: number[] = [];

    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      dataDays.push(d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));

      const taskFilter: any = {
        tenantId: tId,
        status: 'Completed',
        updatedAt: { $gte: start, $lte: end },
      };
      if (projectId) taskFilter.projectId = new Types.ObjectId(projectId);
      const completedTasks = await this.taskModel.countDocuments(taskFilter);
      taskCompletedData.push(completedTasks);

      const queryFilter: any = {
        tenantId: tId,
        status: { $in: ['Resolved', 'Closed'] },
        resolvedAt: { $gte: start, $lte: end },
      };
      if (projectId) queryFilter.projectId = new Types.ObjectId(projectId);
      const resolvedQueries = await this.clientQueryModel.countDocuments(queryFilter);
      queryResolvedData.push(resolvedQueries);
    }

    return {
      labels: dataDays,
      tasksCompleted: taskCompletedData,
      queriesResolved: queryResolvedData,
    };
  }

  async getReport(tenantId: string, startDateStr: string, timeframe: string, projectId: string | undefined): Promise<any> {
    const tId = new Types.ObjectId(tenantId);
    const startDate = new Date(startDateStr);
    const endDate = new Date(startDate);

    if (timeframe === 'monthly') {
      endDate.setMonth(startDate.getMonth() + 1);
    } else if (timeframe === 'yearly') {
      endDate.setFullYear(startDate.getFullYear() + 1);
    } else {
      endDate.setDate(startDate.getDate() + 7); // weekly default
    }

    // Tasks stats
    const taskFilter: any = { tenantId: tId };
    if (projectId) taskFilter.projectId = new Types.ObjectId(projectId);

    const tasks = await this.taskModel.find(taskFilter).exec();
    
    const periodTaskFilter: any = {
      tenantId: tId,
      createdAt: { $gte: startDate, $lt: endDate },
    };
    if (projectId) periodTaskFilter.projectId = new Types.ObjectId(projectId);

    const periodTasks = await this.taskModel.find(periodTaskFilter).exec();

    const taskSummary = {
      total: periodTasks.length,
      completed: periodTasks.filter((t) => t.status === 'Completed').length,
      inProgress: periodTasks.filter((t) => t.status === 'In Progress').length,
      avgProgress: periodTasks.length > 0 ? Math.round(periodTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / periodTasks.length) : 0,
    };

    // Employee performance table
    const employees = await this.userModel.find({ tenantId: tId, userType: { $ne: 'client' } }).lean();
    const employeeRows: any[] = [];
    for (const emp of employees) {
      const empTasks = await this.taskModel.find({ tenantId: tId, assignees: emp._id }).exec();
      const totalAssigned = empTasks.length;
      const completed = empTasks.filter((t) => t.status === 'Completed').length;
      const avgProgress = totalAssigned > 0 ? Math.round(empTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / totalAssigned) : 0;
      employeeRows.push({
        name: emp.name,
        email: emp.email,
        totalTasks: totalAssigned,
        completedTasks: completed,
        avgProgress,
      });
    }

    // Queries stats
    const queryFilter: any = {
      tenantId: tId,
      createdAt: { $gte: startDate, $lt: endDate },
    };
    if (projectId) queryFilter.projectId = new Types.ObjectId(projectId);

    const queries = await this.clientQueryModel.find(queryFilter).exec();
    const resolvedQueries = queries.filter((q) => q.status === 'Resolved' || q.status === 'Closed');
    const avgResolutionTime =
      resolvedQueries.length > 0
        ? Math.round((resolvedQueries.reduce((sum, q) => sum + (q.resolutionTime || 0), 0) / resolvedQueries.length) * 10) / 10
        : 0;

    const querySummary = {
      totalRaised: queries.length,
      totalResolved: resolvedQueries.length,
      avgResolutionTime,
    };

    return {
      startDate: startDateStr,
      timeframe,
      taskSummary,
      employeeRows,
      querySummary,
    };
  }

  async exportReportCSV(tenantId: string, startDateStr: string, timeframe: string, projectId: string | undefined): Promise<string> {
    const reportData = await this.getReport(tenantId, startDateStr, timeframe, projectId);

    let csv = `REPORT SUMMARY (Start: ${reportData.startDate}, Timeframe: ${reportData.timeframe})\n\n`;

    csv += `TASK SUMMARY\n`;
    csv += `Total Tasks Created,Completed Tasks,In Progress Tasks,Average Progress (%)\n`;
    csv += `${reportData.taskSummary.total},${reportData.taskSummary.completed},${reportData.taskSummary.inProgress},${reportData.taskSummary.avgProgress}%\n\n`;

    csv += `CLIENT QUERY SUMMARY\n`;
    csv += `Queries Raised,Queries Resolved,Avg Resolution Time (Hours)\n`;
    csv += `${reportData.querySummary.totalRaised},${reportData.querySummary.totalResolved},${reportData.querySummary.avgResolutionTime} hrs\n\n`;

    csv += `EMPLOYEE PERFORMANCE SHEET\n`;
    csv += `Employee Name,Employee Email,Assigned Tasks,Completed Tasks,Average Task Progress (%)\n`;
    reportData.employeeRows.forEach((row: any) => {
      csv += `"${row.name}","${row.email}",${row.totalTasks},${row.completedTasks},${row.avgProgress}%\n`;
    });

    return csv;
  }

  // --- NOTIFICATIONS METHODS ---

  async getNotifications(tenantId: string, userId: string): Promise<Notification[]> {
    return this.notificationModel
      .find({ tenantId: new Types.ObjectId(tenantId), userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markNotificationRead(tenantId: string, notificationId: string, userId: string): Promise<Notification> {
    const notif = await this.notificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(notificationId),
        tenantId: new Types.ObjectId(tenantId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notif) {
      throw new NotFoundException('Notification not found');
    }
    return notif;
  }

  async markAllNotificationsRead(tenantId: string, userId: string): Promise<any> {
    return this.notificationModel.updateMany(
      {
        tenantId: new Types.ObjectId(tenantId),
        userId: new Types.ObjectId(userId),
        isRead: false,
      },
      { $set: { isRead: true } }
    ).exec();
  }

  async getOverviewStats(tenantId: string, role: string, userId: string, projectId: string | undefined): Promise<any> {
    const tId = new Types.ObjectId(tenantId);
    const uId = new Types.ObjectId(userId);
    const now = new Date();

    // 1. My Active Tasks
    const activeTasksQuery: any = {
      tenantId: tId,
      status: { $ne: 'Completed' },
    };
    if (role === 'Client') {
      if (!projectId) return this.emptyOverview();
      activeTasksQuery.projectId = new Types.ObjectId(projectId);
    } else {
      if (projectId) activeTasksQuery.projectId = new Types.ObjectId(projectId);
      if (role === 'Employee') activeTasksQuery.assignees = uId;
    }
    const myActiveTasks = await this.taskModel.countDocuments(activeTasksQuery);

    // 2. Overdue Tasks
    const overdueQuery: any = {
      tenantId: tId,
      status: { $ne: 'Completed' },
      deadline: { $lt: now },
    };
    if (role === 'Client') {
      overdueQuery.projectId = new Types.ObjectId(projectId!);
    } else {
      if (projectId) overdueQuery.projectId = new Types.ObjectId(projectId);
      if (role === 'Employee') overdueQuery.assignees = uId;
    }
    const overdueTasks = await this.taskModel.countDocuments(overdueQuery);

    // 3. Open Queries
    const openQueriesQuery: any = {
      tenantId: tId,
      status: { $in: ['Open', 'Assigned', 'In Progress'] },
    };
    if (role === 'Client') {
      openQueriesQuery.projectId = new Types.ObjectId(projectId!);
      openQueriesQuery.client = uId;
    } else {
      if (projectId) openQueriesQuery.projectId = new Types.ObjectId(projectId);
      if (role === 'Employee') openQueriesQuery.assignedTo = uId;
    }
    const openQueries = await this.clientQueryModel.countDocuments(openQueriesQuery);

    // 4. Completed This Week
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const completedQuery: any = {
      tenantId: tId,
      status: 'Completed',
      updatedAt: { $gte: startOfWeek },
    };
    if (role === 'Client') {
      completedQuery.projectId = new Types.ObjectId(projectId!);
    } else {
      if (projectId) completedQuery.projectId = new Types.ObjectId(projectId);
      if (role === 'Employee') completedQuery.assignees = uId;
    }
    const completedThisWeek = await this.taskModel.countDocuments(completedQuery);

    return {
      myActiveTasks,
      overdueTasks,
      openQueries,
      completedThisWeek,
    };
  }

  private emptyOverview() {
    return {
      myActiveTasks: 0,
      overdueTasks: 0,
      openQueries: 0,
      completedThisWeek: 0,
    };
  }
}
