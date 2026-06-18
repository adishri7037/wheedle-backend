import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
class Attachment {
  @Prop({ required: true })
  filename!: string;

  @Prop({ required: true })
  url!: string;

  @Prop({ type: Number })
  size?: number;
}

const AttachmentSchema = SchemaFactory.createForClass(Attachment);


@Schema({ timestamps: true })
class ChatMessage {
  @Prop({ type: String })
  text?: string;

  @Prop({ type: String })
  mediaUrl?: string;

  @Prop({ required: true })
  authorName!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  createdAt!: Date;
}

const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

@Schema({ timestamps: true })
export class ClientQuery extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  client!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Task', index: true })
  taskId?: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  category!: string;

  @Prop({ required: true, default: 'Medium', enum: ['High', 'Medium', 'Low'] })
  priority!: 'High' | 'Medium' | 'Low';

  @Prop({ required: true })
  description!: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments!: Attachment[];

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assignedTo?: Types.ObjectId;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages!: ChatMessage[];

  @Prop({
    required: true,
    default: 'Open',
    enum: ['Open', 'Assigned', 'In Progress', 'Waiting for Client', 'Resolved', 'Closed'],
    index: true,
  })
  status!: 'Open' | 'Assigned' | 'In Progress' | 'Waiting for Client' | 'Resolved' | 'Closed';

  @Prop({ type: Number, default: 0 })
  resolutionTime!: number; // Tracked in hours

  @Prop({ type: Date })
  resolvedAt?: Date;
}

export const ClientQuerySchema = SchemaFactory.createForClass(ClientQuery);
