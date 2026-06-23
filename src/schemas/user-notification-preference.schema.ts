import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './rbac/user.schema';

export type UserNotificationPreferenceDocument = UserNotificationPreference & Document;

@Schema({ timestamps: true })
export class UserNotificationPreference {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true, unique: true })
  userId: User | Types.ObjectId;

  // Global toggles
  @Prop({ required: true, default: true })
  emailNotifications: boolean;

  @Prop({ required: true, default: true })
  pushNotifications: boolean;

  @Prop({ required: true, default: true })
  inAppNotifications: boolean;

  // Array of categories that the user has muted (e.g. ['chat', 'system'])
  @Prop({ type: [String], default: [] })
  mutedCategories: string[];
}

export const UserNotificationPreferenceSchema = SchemaFactory.createForClass(UserNotificationPreference);
