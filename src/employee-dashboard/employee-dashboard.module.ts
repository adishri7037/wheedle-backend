import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeeDashboardService } from './employee-dashboard.service';
import { EmployeeDashboardController } from './employee-dashboard.controller';
import { Task, TaskSchema } from '../schemas/task.schema';
import { ClientQuery, ClientQuerySchema } from '../schemas/client-query.schema';
import { User, UserSchema } from '../schemas/rbac/user.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: ClientQuery.name, schema: ClientQuerySchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
    RbacModule,
  ],
  providers: [EmployeeDashboardService],
  controllers: [EmployeeDashboardController],
  exports: [EmployeeDashboardService],
})
export class EmployeeDashboardModule {}
