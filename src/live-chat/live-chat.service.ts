import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LiveChat } from '../schemas/live-chat.schema';
import { LiveLead } from '../schemas/live-lead.schema';
import { LiveSupport } from '../schemas/live-support.schema';
import { LiveChatGateway } from './live-chat.gateway';
import { ChatSession } from '../schemas/chat-session.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LiveChatService {
  constructor(
    @InjectModel(LiveChat.name) private chatModel: Model<LiveChat>,
    @InjectModel(LiveLead.name) private leadModel: Model<LiveLead>,
    @InjectModel(LiveSupport.name) private supportModel: Model<LiveSupport>,
    @InjectModel(ChatSession.name) private chatSessionModel: Model<ChatSession>,
    private gateway: LiveChatGateway,
    private notificationsService: NotificationsService,
  ) {}

  private normalizePhone(phone: any) {
    return (phone || '').toString().replace(/\D/g, '');
  }

  async createLead(data: any) {
    const lead = await new this.leadModel(data).save();
    const chat = await new this.chatModel({
      type: 'new_user',
      status: 'open',
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      service: data.service,
      lead_id: lead._id,
      messages: [],
    }).save();

    // Create/Update ChatSession for mobile-based continuation (sessionId == chat_id)
    try {
      await this.chatSessionModel
        .updateOne(
          { sessionId: chat._id.toString() },
          {
            $set: {
              sessionId: chat._id.toString(),
              phone: this.normalizePhone(data.mobile),
              name: chat.name,
              email: chat.email || '',
              status: chat.status || 'active',
            },
          },
          { upsert: true },
        )
        .exec();
    } catch (e) {
      // non-blocking
      console.error('[LiveChatService] ChatSession upsert failed (new-user-lead):', e);
    }

    this.gateway.emitNewChat({
      chat_id: chat._id,
      name: chat.name,
      service: chat.service,
      type: chat.type,
      status: chat.status,
      created_at: chat['createdAt'],
    });

    try {
      await this.notificationsService.createEvent({
        title: 'New Live Chat',
        message: `${data.name} started a new chat for ${data.service}`,
        category: 'chat',
        priority: 'high',
        resourceType: 'live-chat',
        resourceId: chat._id.toString(),
        link: 'livechat',
        requiredModuleKey: 'live-chat',
        requiredPermissionKey: 'livechat.view',
      });
    } catch (e) {
      console.error('[LiveChatService] Failed to create notification for new chat:', e);
    }

    return { chat_id: chat._id };
  }

  async createSupport(data: any) {
    const support = await new this.supportModel(data).save();
    const chat = await new this.chatModel({
      type: 'client',
      status: 'open',
      name: data.company,
      email: data.email,
      mobile: data.mobile,
      service: 'Support',
      support_id: support._id,
      messages: [],
    }).save();

    // Create/Update ChatSession for mobile-based continuation (sessionId == chat_id)
    try {
      await this.chatSessionModel
        .updateOne(
          { sessionId: chat._id.toString() },
          {
            $set: {
              sessionId: chat._id.toString(),
              phone: this.normalizePhone(data.mobile),
              name: chat.name,
              email: chat.email || '',
              status: chat.status || 'active',
            },
          },
          { upsert: true },
        )
        .exec();
    } catch (e) {
      // non-blocking
      console.error('[LiveChatService] ChatSession upsert failed (client-support):', e);
    }

    this.gateway.emitNewChat({
      chat_id: chat._id,
      name: chat.name,
      service: chat.service,
      type: chat.type,
      status: chat.status,
      created_at: chat['createdAt'],
    });

    try {
      await this.notificationsService.createEvent({
        title: 'New Client Support Chat',
        message: `${data.company} started a support chat`,
        category: 'chat',
        priority: 'high',
        resourceType: 'live-chat',
        resourceId: chat._id.toString(),
        link: 'livechat',
        requiredModuleKey: 'live-chat',
        requiredPermissionKey: 'livechat.view',
      });
    } catch (e) {
      console.error('[LiveChatService] Failed to create notification for client chat:', e);
    }

    return { chat_id: chat._id };
  }

  async findAll() {
    return this.chatModel.find().sort({ updatedAt: -1 }).exec();
  }

  async findOne(id: string) {
    return this.chatModel.findById(id).exec();
  }

  async close(id: string) {
    await this.chatModel.findByIdAndUpdate(id, { status: 'closed' }).exec();
    this.gateway.emitChatClosed({ chat_id: id });
    return { ok: true };
  }
}

