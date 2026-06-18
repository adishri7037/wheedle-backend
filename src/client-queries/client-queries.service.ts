import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClientQuery } from '../schemas/client-query.schema';
import { Notification } from '../schemas/notification.schema';
import { Task } from '../schemas/task.schema';
import { ClientQueriesGateway } from './client-queries.gateway';

@Injectable()
export class ClientQueriesService {
  constructor(
    @InjectModel(ClientQuery.name) private clientQueryModel: Model<ClientQuery>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @Inject(forwardRef(() => ClientQueriesGateway))
    private clientQueriesGateway: ClientQueriesGateway,
  ) {}

  async createNotification(tenantId: string, userId: string, title: string, message: string, type?: string) {
    try {
      await this.notificationModel.create({
        tenantId: new Types.ObjectId(tenantId),
        userId: new Types.ObjectId(userId),
        title,
        message,
        isRead: false,
        type: type || 'query_notification',
      });
    } catch (e) {
      console.error('Failed to create query notification:', e);
    }
  }

  async raiseQuery(tenantId: string, clientId: string, projectId: string | undefined, payload: any): Promise<ClientQuery> {
    const { title, category, priority, description, attachments, taskId } = payload;

    let assignedTo = undefined;
    let task: any = null;

    if (taskId) {
      task = await this.taskModel.findById(taskId);
      if (task && task.assignees && task.assignees.length > 0) {
        assignedTo = task.assignees[0];
      }
    }

    const query = new this.clientQueryModel({
      tenantId: new Types.ObjectId(tenantId),
      client: new Types.ObjectId(clientId),
      projectId: projectId ? new Types.ObjectId(projectId) : undefined,
      taskId: taskId ? new Types.ObjectId(taskId) : undefined,
      assignedTo,
      title,
      category,
      priority: priority || 'Medium',
      description,
      attachments: attachments || [],
      status: assignedTo ? 'Assigned' : 'Open',
    });

    const savedQuery = await query.save();

    if (task) {
      const notifTitle = 'New Query Raised on Task';
      const notifMessage = `A client has raised a query regarding the task: ${task.title}`;
      
      const notifyUsers = new Set<string>();
      if (task.createdBy) notifyUsers.add(task.createdBy.toString());
      if (task.assignees) {
        task.assignees.forEach(a => notifyUsers.add(a.toString()));
      }

      for (const uId of notifyUsers) {
        await this.createNotification(tenantId, uId, notifTitle, notifMessage, 'task_query');
      }

      await this.taskModel.updateOne({ _id: task._id }, { hasQuery: true });
    }

    return savedQuery;
  }

  async getQueries(
    tenantId: string,
    role: string,
    userId: string,
    projectId: string | undefined,
    filters: { status?: string; priority?: string; category?: string; search?: string }
  ): Promise<any[]> {
    const query: any = { tenantId: new Types.ObjectId(tenantId) };

    if (role === 'Client') {
      query.client = new Types.ObjectId(userId);
      if (projectId) {
        query.projectId = new Types.ObjectId(projectId);
      }
    }
    else {
      if (projectId) {
        query.projectId = new Types.ObjectId(projectId);
      }
      if (role === 'Employee') {
        query.assignedTo = new Types.ObjectId(userId);
      }
    }

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.clientQueryModel
      .find(query)
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('projectId', 'projectName')
      .populate('taskId', 'title')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getQueryById(tenantId: string, id: string): Promise<ClientQuery> {
    const query = await this.clientQueryModel
      .findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) })
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('projectId', 'projectName')
      .populate('taskId', 'title')
      .exec();

    if (!query) {
      throw new NotFoundException('Client query not found');
    }
    return query;
  }

  async getQueryByTaskId(tenantId: string, taskId: string): Promise<ClientQuery> {
    const query = await this.clientQueryModel
      .findOne({ taskId: new Types.ObjectId(taskId), tenantId: new Types.ObjectId(tenantId) })
      .populate('client', 'name email')
      .populate('assignedTo', 'name email')
      .populate('projectId', 'projectName')
      .populate('taskId', 'title')
      .exec();

    if (!query) {
      throw new NotFoundException('Client query not found for this task');
    }
    return query;
  }

  async assignQuery(tenantId: string, id: string, assigneeId: string): Promise<ClientQuery> {
    const query = await this.clientQueryModel.findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) });
    if (!query) {
      throw new NotFoundException('Client query not found');
    }

    query.assignedTo = assigneeId ? new Types.ObjectId(assigneeId) : undefined;
    query.status = 'Assigned';

    const savedQuery = await query.save();

    if (assigneeId) {
      await this.createNotification(
        tenantId,
        assigneeId,
        'Client Query Assigned',
        `Query "${query.title}" has been assigned to you.`,
        'query_assigned'
      );
    }

    return savedQuery;
  }

  async updateStatus(tenantId: string, id: string, status: string): Promise<ClientQuery> {
    const query = await this.clientQueryModel.findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) });
    if (!query) {
      throw new NotFoundException('Client query not found');
    }

    query.status = status as any;

    if (status === 'Resolved') {
      query.resolvedAt = new Date();
      // Calculate resolution time in hours
      const diffMs = query.resolvedAt.getTime() - (query as any).createdAt.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      query.resolutionTime = Math.round(diffHours * 100) / 100; // Round to 2 decimal places
    }

    const savedQuery = await query.save();

    // Notify client if resolved or closed
    if (status === 'Resolved' || status === 'Closed') {
      await this.createNotification(
        tenantId,
        String(query.client),
        'Client Query Updated',
        `Your query "${query.title}" has been set to: ${status}.`,
        'query_status'
      );
    }

    return savedQuery;
  }

  async addChatMessage(
    tenantId: string,
    id: string,
    userId: string,
    userName: string,
    text: string,
    mediaUrl?: string
  ): Promise<ClientQuery> {
    const query = await this.clientQueryModel.findOne({ _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) });
    if (!query) {
      throw new NotFoundException('Client query not found');
    }

    query.messages.push({
      text,
      mediaUrl,
      authorId: new Types.ObjectId(userId),
      authorName: userName,
      createdAt: new Date(),
    } as any);

    const savedQuery = await query.save();
    
    // Auto-update other side
    this.clientQueriesGateway.notifyQueryUpdate(id, savedQuery);
    
    // Notifications logic
    try {
      const isClientAuthor = query.client && query.client.toString() === userId;
      const notifTitle = 'New Chat Reply';
      const notifMessage = `New message from ${userName} regarding the query: ${query.title}`;

      if (isClientAuthor) {
        if (query.assignedTo) {
          await this.createNotification(tenantId, query.assignedTo.toString(), notifTitle, notifMessage, 'query_message');
        }
      } else {
        if (query.client) {
          await this.createNotification(tenantId, query.client.toString(), notifTitle, notifMessage, 'query_message');
        }
      }
    } catch (e) {
      console.error('Failed to send chat notifications', e);
    }
    
    return savedQuery;
  }
}
