import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FormLead } from '../schemas/form-lead.schema';

@Injectable()
export class FormLeadService {
  constructor(@InjectModel(FormLead.name) private formLeadModel: Model<FormLead>) {}

  async create(data: any) {
    const newLead = new this.formLeadModel(data);
    return newLead.save();
  }

  async findAll() {
    return this.formLeadModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateStatus(id: string, status: string) {
    return this.formLeadModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
  }

  async delete(id: string) {
    return this.formLeadModel.findByIdAndDelete(id).exec();
  }

  async countAll() {
    return this.formLeadModel.countDocuments().exec();
  }
}
