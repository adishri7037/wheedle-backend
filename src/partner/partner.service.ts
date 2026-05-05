import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partner } from '../schemas/partner.schema';

@Injectable()
export class PartnerService {
  constructor(@InjectModel(Partner.name) private partnerModel: Model<Partner>) {}

  async create(data: any) {
    const newPartner = new this.partnerModel(data);
    return newPartner.save();
  }

  async findAll() {
    return this.partnerModel.find().exec();
  }

  async delete(id: string) {
    return this.partnerModel.findByIdAndDelete(id).exec();
  }
}
