import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from '../schemas/task.schema';
import { User } from '../schemas/rbac/user.schema';
import { Notification } from '../schemas/notification.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
  ) {}

  async notifyAssignees(tenantId: string, assigneeIds: Types.ObjectId[], title: string, message: string) {
    try {
      const notifications = assigneeIds.map((userId) => ({
        tenantId: new Types.ObjectId(tenantId),
        userId,
        title,
        message,
        isRead: false,
        type: 'task_assigned',
      }));
      if (notifications.length > 0) {
        await this.notificationModel.insertMany(notifications);
      }
    } catch (e) {
      console.error('Failed to create notification:', e);
    }
  }


  async createTask(tenantId: string, userId: string, payload: any): Promise<Task> {
    const { title, description, priority, status, deadline, estimatedHours, assignees, progress, calendarDate, projectId, attachments } = payload;

    // Convert assignees to ObjectIds
    const assigneeIds = (assignees || []).map((id: string) => new Types.ObjectId(id));

    const task = new this.taskModel({
      tenantId: new Types.ObjectId(tenantId),
      title,
      description,
      priority,
      status,
      deadline: deadline ? new Date(deadline) : undefined,
      estimatedHours: estimatedHours || 0,
      assignees: assigneeIds,
      progress: progress || 0,
      calendarDate: calendarDate ? new Date(calendarDate) : undefined,
      createdBy: new Types.ObjectId(userId),
      projectId: projectId ? new Types.ObjectId(projectId) : undefined,
      attachments: attachments || [],
    });

    const savedTask = await task.save();
    if (assigneeIds.length > 0) {
      await this.notifyAssignees(tenantId, assigneeIds, 'New Task Assigned', `You have been assigned to: ${title}`);
    }
    return savedTask;
  }


  async getTasks(
    tenantId: string,
    role: string,
    userId: string,
    projectId: string | undefined,
    filters: { status?: string; priority?: string; assignee?: string; search?: string }
  ): Promise<any[]> {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };

    if (role === 'Client') {
      if (!projectId) return []; // Clients without a project see nothing
      query.projectId = new Types.ObjectId(projectId);
    } else {
      if (projectId) {
        query.projectId = new Types.ObjectId(projectId);
      }
      if (role === 'Employee') {
        query.assignees = new Types.ObjectId(userId);
      } else if (filters.assignee) {
        query.assignees = new Types.ObjectId(filters.assignee);
      }
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.priority) {
      query.priority = filters.priority;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.taskModel
      .find(query)
      .populate('assignees', 'name email userType')
      .populate('createdBy', 'name email')
      .populate('projectId', 'projectName')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getTaskById(tenantId: string, id: string): Promise<Task> {
    const task = await this.taskModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) })
      .populate('assignees', 'name email userType')
      .populate('createdBy', 'name email')
      .populate('projectId', 'projectName')
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async updateTask(tenantId: string, id: string, payload: any): Promise<Task> {
    const task = await this.taskModel.findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const { title, description, priority, status, deadline, estimatedHours, assignees, progress, calendarDate, projectId, attachments } = payload;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : undefined;
    if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
    if (progress !== undefined) task.progress = progress;
    if (calendarDate !== undefined) task.calendarDate = calendarDate ? new Date(calendarDate) : undefined;
    if (projectId !== undefined) task.projectId = projectId ? new Types.ObjectId(projectId) : undefined;
    if (attachments !== undefined) task.attachments = attachments;

    let originalAssignees: string[] = [];
    if (task.assignees) {
      originalAssignees = task.assignees.map(a => String(a));
    }

    if (assignees !== undefined) {
      task.assignees = assignees.map((aId: string) => new Types.ObjectId(aId));
    }

    const savedTask = await task.save();

    if (assignees !== undefined) {
      const newAssignees = assignees.filter((aId: string) => !originalAssignees.includes(aId));
      if (newAssignees.length > 0) {
        await this.notifyAssignees(
          tenantId,
          newAssignees.map((aId: string) => new Types.ObjectId(aId)),
          'New Task Assigned',
          `You have been assigned to: ${task.title}`
        );
      }
    }

    return savedTask;
  }


  async updateTaskStatus(tenantId: string, userId: string, role: string, id: string, payload: { status?: string; progress?: number; attachments?: any[] }): Promise<Task> {
    const task = await this.taskModel.findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if employee is assigned to this task
    if (role === 'Employee' && !task.assignees.some((aId) => String(aId) === userId)) {
      throw new BadRequestException('You can only update tasks assigned to you');
    }

    if (payload.status !== undefined) {
      task.status = payload.status as any;
      if (payload.status === 'Completed') {
        task.progress = 100;
      }
    }
    if (payload.progress !== undefined) {
      task.progress = payload.progress;
      if (payload.progress === 100) {
        task.status = 'Completed';
      } else if (payload.progress > 0 && task.status === 'Not Started') {
        task.status = 'In Progress';
      }
    }
    if (payload.attachments !== undefined) {
      task.attachments = payload.attachments as any;
    }

    return task.save();
  }

  async deleteTask(tenantId: string, id: string): Promise<any> {
    const result = await this.taskModel.deleteOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Task not found');
    }
    return { message: 'Task deleted successfully' };
  }

  async calendarAssign(tenantId: string, id: string, payload: { calendarDate?: string; assigneeId?: string }): Promise<Task> {
    const task = await this.taskModel.findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) });
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (payload.calendarDate !== undefined) {
      task.calendarDate = payload.calendarDate ? new Date(payload.calendarDate) : undefined;
    }

    let originalAssignees: string[] = [];
    if (task.assignees) {
      originalAssignees = task.assignees.map(a => String(a));
    }

    if (payload.assigneeId !== undefined) {
      // Replaces assignee list with this single assignee (standard for calendar planning drag/drop)
      task.assignees = payload.assigneeId ? [new Types.ObjectId(payload.assigneeId)] : [];
    }

    const savedTask = await task.save();

    if (payload.assigneeId && !originalAssignees.includes(payload.assigneeId)) {
      await this.notifyAssignees(
        tenantId,
        [new Types.ObjectId(payload.assigneeId)],
        'Task Assigned via Calendar',
        `You have been assigned to: ${task.title}`
      );
    }

    return savedTask;
  }


  async getWeeklyCalendar(tenantId: string, role: string, userId: string, projectId: string | undefined, startOfWeekStr: string): Promise<any> {
    const startOfWeek = new Date(startOfWeekStr);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const query: any = {
      tenantId: new Types.ObjectId(tenantId),
      calendarDate: {
        $gte: startOfWeek,
        $lt: endOfWeek,
      },
    };

    if (role === 'Client') {
      if (!projectId) return {}; // Clients without project see no calendar
      query.projectId = new Types.ObjectId(projectId);
    } else {
      if (projectId) {
        query.projectId = new Types.ObjectId(projectId);
      }
      if (role === 'Employee') {
        query.assignees = new Types.ObjectId(userId);
      }
    }

    const tasks = await this.taskModel
      .find(query)
      .populate('assignees', 'name email userType')
      .populate('projectId', 'projectName')
      .exec();

    // Group tasks by day of week (Mon-Sun)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const grouped: Record<string, any[]> = {};
    days.forEach((day) => (grouped[day] = []));

    tasks.forEach((task) => {
      if (task.calendarDate) {
        let dayIndex = task.calendarDate.getDay(); // 0 is Sunday, 1 is Monday...
        // Map so 0 is Monday, 6 is Sunday
        dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        const dayName = days[dayIndex];
        if (dayName) {
          grouped[dayName].push(task);
        }
      }
    });

    return grouped;
  }
}
