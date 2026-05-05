import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Testimonial } from '../schemas/testimonial.schema';

@Injectable()
export class TestimonialService {
  constructor(@InjectModel(Testimonial.name) private testimonialModel: Model<Testimonial>) {}

  async create(data: any) {
    const newTestimonial = new this.testimonialModel(data);
    return newTestimonial.save();
  }

  async findAll() {
    return this.testimonialModel.find().exec();
  }

  async delete(id: string) {
    return this.testimonialModel.findByIdAndDelete(id).exec();
  }
}
