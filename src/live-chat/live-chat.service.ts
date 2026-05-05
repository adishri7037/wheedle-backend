import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LiveChat } from '../schemas/live-chat.schema';
import { LiveLead } from '../schemas/live-lead.schema';
import { LiveSupport } from '../schemas/live-support.schema';
import { LiveChatGateway } from './live-chat.gateway';

@Injectable()
export class LiveChatService {
  constructor(
    @InjectModel(LiveChat.name) private chatModel: Model<LiveChat>,
    @InjectModel(LiveLead.name) private leadModel: Model<LiveLead>,
    @InjectModel(LiveSupport.name) private supportModel: Model<LiveSupport>,
    private gateway: LiveChatGateway,
  ) {}

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

    this.gateway.emitNewChat({
      chat_id: chat._id,
      name: chat.name,
      service: chat.service,
      type: chat.type,
      status: chat.status,
      created_at: chat['createdAt'],
    });

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

    this.gateway.emitNewChat({
      chat_id: chat._id,
      name: chat.name,
      service: chat.service,
      type: chat.type,
      status: chat.status,
      created_at: chat['createdAt'],
    });

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
