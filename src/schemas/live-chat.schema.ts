import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'live_chats' })
export class LiveChat extends Document {
  @Prop()
  type: string; // 'new_user' or 'client'

  @Prop({ default: 'open' })
  status: string; // 'open' or 'closed'

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  mobile: string;

  @Prop()
  service: string;

  @Prop()
  lead_id: string;

  @Prop()
  support_id: string;

  @Prop({ type: Array, default: [] })
  messages: any[];
}

export const LiveChatSchema = SchemaFactory.createForClass(LiveChat);
