import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead } from '../schemas/lead.schema';

@Injectable()
export class LeadService {
  constructor(@InjectModel(Lead.name) private leadModel: Model<Lead>) {}

  async create(data: any) {
    const existing = await this.leadModel.findOne({ value: data.value }).exec();
    if (existing) {
      throw new BadRequestException('Lead already exists');
    }
    const newLead = new this.leadModel(data);
    return newLead.save();
  }

  async findAll() {
    return this.leadModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateStatus(id: string, status: string) {
    return this.leadModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async delete(id: string) {
    return this.leadModel.findByIdAndDelete(id).exec();
  }

  async countAll() {
    return this.leadModel.countDocuments().exec();
  }
}
