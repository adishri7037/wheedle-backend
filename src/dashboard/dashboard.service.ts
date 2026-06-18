import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin } from '../schemas/admin.schema';
import { Blog } from '../schemas/blog.schema';
import { Contact } from '../schemas/contact.schema';
import { Job } from '../schemas/job.schema';
import { Partner } from '../schemas/partner.schema';
import { Testimonial } from '../schemas/testimonial.schema';
import { FormLead } from '../schemas/form-lead.schema';
import { Lead } from '../schemas/lead.schema';
import { Step } from '../schemas/step.schema';
import { LiveChat } from '../schemas/live-chat.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    @InjectModel(Blog.name) private blogModel: Model<Blog>,
    @InjectModel(Contact.name) private contactModel: Model<Contact>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
    @InjectModel(Partner.name) private partnerModel: Model<Partner>,
    @InjectModel(Testimonial.name) private testimonialModel: Model<Testimonial>,
    @InjectModel(FormLead.name) private formLeadModel: Model<FormLead>,
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @InjectModel(Step.name) private stepModel: Model<Step>,
    @InjectModel(LiveChat.name) private liveChatModel: Model<LiveChat>,
  ) {}

  async getDashboardData(user: any) {
    const [
      leads,
      formLeads,
      contacts,
      blogs,
      jobs,
      openChats,
      closedChats,
      recentChats,
    ] = await Promise.all([
      this.leadModel.countDocuments(),
      this.formLeadModel.countDocuments(),
      this.contactModel.countDocuments(),
      this.blogModel.countDocuments(),
      this.jobModel.countDocuments(),
      this.liveChatModel.countDocuments({ status: 'open' }),
      this.liveChatModel.countDocuments({ status: 'closed' }),
      this.liveChatModel.find().sort({ updatedAt: -1 }).limit(20).exec(),
    ]);

    return {
      message: 'Welcome Admin Dashboard',
      adminId: user?.id ?? user?._id ?? null,
      counts: {
        leads,
        formLeads,
        contacts,
        blogs,
        jobs,
        openChats,
        closedChats,
        totalChats: openChats + closedChats,
      },
      recentChats,
    };
  }
}
