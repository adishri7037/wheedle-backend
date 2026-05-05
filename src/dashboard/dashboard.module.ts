import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Admin, AdminSchema } from '../schemas/admin.schema';
import { Blog, BlogSchema } from '../schemas/blog.schema';
import { Contact, ContactSchema } from '../schemas/contact.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { Partner, PartnerSchema } from '../schemas/partner.schema';
import { Testimonial, TestimonialSchema } from '../schemas/testimonial.schema';
import { FormLead, FormLeadSchema } from '../schemas/form-lead.schema';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { Step, StepSchema } from '../schemas/step.schema';
import { LiveChat, LiveChatSchema } from '../schemas/live-chat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: Contact.name, schema: ContactSchema },
      { name: Job.name, schema: JobSchema },
      { name: Partner.name, schema: PartnerSchema },
      { name: Testimonial.name, schema: TestimonialSchema },
      { name: FormLead.name, schema: FormLeadSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Step.name, schema: StepSchema },
      { name: LiveChat.name, schema: LiveChatSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService]
})
export class DashboardModule {}
