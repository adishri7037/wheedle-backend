import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, required: false, index: true })
  tenantId?: Types.ObjectId; // Optional for multi-tenancy compatibility

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: ['chat', 'query', 'task', 'system'], default: 'system' })
  category: string;

  @Prop({ required: true, enum: ['low', 'medium', 'high', 'critical'], default: 'low' })
  priority: string;

  @Prop()
  type: string;

  @Prop({ index: true })
  resourceType: string;

  @Prop({ index: true })
  resourceId: string;

  @Prop()
  link: string;

  @Prop()
  groupId: string; // Used for grouping bulk events

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Compound index for resource retrieval
NotificationSchema.index({ resourceType: 1, resourceId: 1 });
