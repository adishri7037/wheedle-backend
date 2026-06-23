import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { NotificationRecipient, NotificationRecipientDocument } from '../schemas/notification-recipient.schema';
import { RbacService } from '../rbac/rbac.service';
import { NotificationsGateway } from './notifications.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface CreateEventParams {
  tenantId?: string;
  title: string;
  message: string;
  category: 'chat' | 'query' | 'task' | 'system';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  type?: string;
  resourceType: string;
  resourceId: string;
  link?: string;
  groupId?: string;
  requiredModuleKey?: string;
  requiredPermissionKey?: string;
  specificUserIds?: string[];
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationRecipient.name) private recipientModel: Model<NotificationRecipientDocument>,
    private rbacService: RbacService,
    private gateway: NotificationsGateway,
  ) {}

  /**
   * Create an event-time resolved notification.
   */
  async createEvent(params: CreateEventParams): Promise<void> {
    try {
      const {
        tenantId, title, message, category, priority = 'low', type, 
        resourceType, resourceId, link, groupId, 
        requiredModuleKey, requiredPermissionKey, specificUserIds
      } = params;

      // 1. Bulk Event Protection
      if (groupId) {
        const recent = await this.notificationModel.findOne({ groupId, createdAt: { $gte: new Date(Date.now() - 60000) } }); // 1 minute throttle
        if (recent) {
          this.logger.debug(`Throttled bulk event for group: ${groupId}`);
          return;
        }
      }

      // 2. PBAC Recipient Resolution
      let recipientUserIds: string[] = [];
      
      if (specificUserIds && specificUserIds.length > 0) {
        recipientUserIds = specificUserIds;
      } else if (requiredModuleKey && requiredPermissionKey) {
        let tId = tenantId;
        if (!tId) {
          // Fallback to default tenant if not provided
          const TenantModel = this.rbacService['tenantModel']; // access tenantModel via rbacService
          const defaultTenant = await TenantModel.findOne().select('_id').lean();
          if (defaultTenant) {
            tId = defaultTenant._id.toString();
          }
        }
        if (tId) {
          recipientUserIds = await this.rbacService.getUsersWithPermission(tId, requiredModuleKey, requiredPermissionKey);
        }
      } else {
        this.logger.warn(`No specific users or PBAC keys provided for notification: ${title}`);
        return;
      }

      if (recipientUserIds.length === 0) {
        return; // No one to notify
      }

      // 3. Create Notification
      const notification = await this.notificationModel.create({
        tenantId: tenantId ? new Types.ObjectId(tenantId) : undefined,
        title,
        message,
        category,
        priority,
        type,
        resourceType,
        resourceId,
        link,
        groupId
      });

      // 4. Create Recipients
      const recipientDocs = recipientUserIds.map(userId => ({
        notificationId: notification._id,
        userId: new Types.ObjectId(userId),
        isRead: false
      }));

      await this.recipientModel.insertMany(recipientDocs);

      // 5. Broadcast via WebSocket
      this.gateway.emitToRecipients(recipientUserIds, {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        priority: notification.priority,
        type: notification.type,
        resourceType: notification.resourceType,
        resourceId: notification.resourceId,
        link: notification.link,
        createdAt: notification.createdAt,
        isRead: false
      });

    } catch (e) {
      this.logger.error('Failed to create notification event', e);
    }
  }

  async getUserNotifications(userId: string, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
    
    const recipients = await this.recipientModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('notificationId')
      .exec();

    return recipients.map(r => {
      const payload: any = r.toObject();
      const notif = payload.notificationId;
      return {
        _id: payload._id,
        notificationId: notif._id,
        title: notif.title,
        message: notif.message,
        category: notif.category,
        priority: notif.priority,
        type: notif.type,
        resourceType: notif.resourceType,
        resourceId: notif.resourceId,
        link: notif.link,
        isRead: payload.isRead,
        createdAt: payload.createdAt,
      };
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.recipientModel.countDocuments({ userId: new Types.ObjectId(userId), isRead: false });
  }

  async markAsRead(userId: string, recipientId: string): Promise<void> {
    await this.recipientModel.updateOne(
      { _id: new Types.ObjectId(recipientId), userId: new Types.ObjectId(userId) },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.recipientModel.updateMany(
      { userId: new Types.ObjectId(userId), isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }

  async deleteNotification(userId: string, recipientId: string): Promise<void> {
    await this.recipientModel.deleteOne({ _id: new Types.ObjectId(recipientId), userId: new Types.ObjectId(userId) });
  }

  // 90 Day Retention Cleanup
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleRetentionCleanup() {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const oldNotifications = await this.notificationModel.find({ createdAt: { $lt: ninetyDaysAgo } }).select('_id').lean();
    const oldIds = oldNotifications.map(n => n._id);

    if (oldIds.length > 0) {
      await this.recipientModel.deleteMany({ notificationId: { $in: oldIds } });
      await this.notificationModel.deleteMany({ _id: { $in: oldIds } });
      this.logger.log(`Cleaned up ${oldIds.length} old notifications`);
    }
  }
}
