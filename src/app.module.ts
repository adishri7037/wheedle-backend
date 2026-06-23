import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BlogModule } from './blog/blog.module';
import { ChatModule } from './chat/chat.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ContactModule } from './contact/contact.module';
import { JobModule } from './job/job.module';
import { PartnerModule } from './partner/partner.module';
import { TestimonialModule } from './testimonial/testimonial.module';
import { LiveChatModule } from './live-chat/live-chat.module';
import { HeroModule } from './hero/hero.module';
import { StepModule } from './step/step.module';
import { FormLeadModule } from './form-lead/form-lead.module';
import { LeadModule } from './lead/lead.module';
import { ProfileModule } from './profile/profile.module';
import { RbacModule } from './rbac/rbac.module';
import { TasksModule } from './tasks/tasks.module';
import { ClientQueriesModule } from './client-queries/client-queries.module';
import { EmployeeDashboardModule } from './employee-dashboard/employee-dashboard.module';
import { ProjectsModule } from './projects/projects.module';
import { UploadModule } from './upload/upload.module';
import { EmailModule } from './email/email.module';
import { InvoicesModule } from './invoices/invoices.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/py/api/uploads',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    BlogModule,
    ChatModule,
    DashboardModule,
    ContactModule,
    JobModule,
    PartnerModule,
    TestimonialModule,
    LiveChatModule,
    HeroModule,
    StepModule,
    FormLeadModule,
    LeadModule,
    ProfileModule,
    RbacModule,
    TasksModule,
    ClientQueriesModule,
    EmployeeDashboardModule,
    ProjectsModule,
    UploadModule,
    EmailModule,
    InvoicesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
