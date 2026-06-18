import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientQueriesService } from './client-queries.service';
import { ClientQueriesController } from './client-queries.controller';
import { ClientQuery, ClientQuerySchema } from '../schemas/client-query.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { Task, TaskSchema } from '../schemas/task.schema';
import { RbacModule } from '../rbac/rbac.module';
import { ClientQueriesGateway } from './client-queries.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClientQuery.name, schema: ClientQuerySchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    RbacModule,
  ],
  providers: [ClientQueriesService, ClientQueriesGateway],
  controllers: [ClientQueriesController],
  exports: [ClientQueriesService],
})
export class ClientQueriesModule {}

