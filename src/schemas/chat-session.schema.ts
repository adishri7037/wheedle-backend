import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'chat_sessions' })
export class ChatSession extends Document {
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ required: true, index: true })
  phone: string;

  @Prop({ default: '' })
  name: string;

  @Prop({ default: '' })
  email: string;

  @Prop({ default: 'active' })
  status: string;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

