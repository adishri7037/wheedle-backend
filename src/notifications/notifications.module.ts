import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { NotificationRecipient, NotificationRecipientSchema } from '../schemas/notification-recipient.schema';
import { UserNotificationPreference, UserNotificationPreferenceSchema } from '../schemas/user-notification-preference.schema';
import { RbacModule } from '../rbac/rbac.module';
import { User, UserSchema } from '../schemas/rbac/user.schema';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: NotificationRecipient.name, schema: NotificationRecipientSchema },
      { name: UserNotificationPreference.name, schema: UserNotificationPreferenceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    RbacModule,
    ScheduleModule.forRoot(), // For cron cleanup jobs
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
