import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Notification } from './notification.schema';
import { User } from './rbac/user.schema';

export type NotificationRecipientDocument = NotificationRecipient & Document;

@Schema({ timestamps: true })
export class NotificationRecipient {
  @Prop({ type: Types.ObjectId, ref: 'Notification', required: true, index: true })
  notificationId: Notification | Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: User | Types.ObjectId;

  @Prop({ required: true, default: false, index: true })
  isRead: boolean;

  @Prop({ required: false })
  readAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationRecipientSchema = SchemaFactory.createForClass(NotificationRecipient);

// Add required composite indexes for performance
NotificationRecipientSchema.index({ userId: 1, isRead: 1 });
NotificationRecipientSchema.index({ userId: 1, createdAt: -1 });
