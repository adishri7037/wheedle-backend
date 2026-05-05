import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from '../schemas/job.schema';

@Injectable()
export class JobService {
  constructor(@InjectModel(Job.name) private jobModel: Model<Job>) {}

  async create(data: any) {
    const newJob = new this.jobModel(data);
    return newJob.save();
  }

  async findAll() {
    return this.jobModel.find().exec();
  }

  async delete(id: string) {
    return this.jobModel.findByIdAndDelete(id).exec();
  }
}
