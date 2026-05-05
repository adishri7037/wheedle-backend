import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({ required: true })
  sessionId: string;

  @Prop({ required: true })
  role: string; // 'user' or 'assistant'

  @Prop({ required: true })
  message: string;

  @Prop()
  userId: string;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
