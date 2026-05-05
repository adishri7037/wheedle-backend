import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Step } from '../schemas/step.schema';

@Injectable()
export class StepService {
  constructor(@InjectModel(Step.name) private stepModel: Model<Step>) {}

  async create(data: any) {
    const newStep = new this.stepModel(data);
    return newStep.save();
  }

  async findAll() {
    return this.stepModel.find().sort({ createdAt: 1 }).exec();
  }

  async delete(id: string) {
    return this.stepModel.findByIdAndDelete(id).exec();
  }
}
