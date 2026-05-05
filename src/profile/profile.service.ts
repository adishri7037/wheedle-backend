import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile } from '../schemas/profile.schema';

@Injectable()
export class ProfileService {
  constructor(@InjectModel(Profile.name) private profileModel: Model<Profile>) {}

  async getProfile() {
    return this.profileModel.findOne().exec();
  }

  async updateProfile(data: any) {
    return this.profileModel.findOneAndUpdate({}, data, { upsert: true, new: true }).exec();
  }
}
