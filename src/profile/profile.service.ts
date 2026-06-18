import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile } from '../schemas/profile.schema';
import { User } from '../schemas/rbac/user.schema';
import { Admin } from '../schemas/admin.schema';

@Injectable()
export class ProfileService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>
  ) {}

  async getProfile(userToken: any) {
    if (!userToken) throw new NotFoundException('User not found');
    
    // Check if user is in User model
    let user = await this.userModel.findById(userToken.id).select('-password').lean();
    if (user) {
      return { profile: { ...user, role: userToken.role } };
    }

    // Check fallback Admin model
    let admin = await this.adminModel.findById(userToken.id).select('-password').lean();
    if (admin) {
      return { profile: { ...admin, role: userToken.role } };
    }

    // Fallback to legacy global profile if not found
    const profile = await this.profileModel.findOne().lean();
    return { profile: profile || {} };
  }

  async updateProfile(userToken: any, data: any) {
    if (!userToken) throw new NotFoundException('User not found');

    const updateData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
    };

    let user = await this.userModel.findById(userToken.id);
    if (user) {
      user.name = updateData.name || user.name;
      user.email = updateData.email || user.email;
      user.phone = updateData.phone || user.phone;
      await user.save();
      return { profile: { ...user.toObject(), role: userToken.role }, message: "Profile updated successfully!" };
    }

    let admin = await this.adminModel.findById(userToken.id);
    if (admin) {
      admin.name = updateData.name || admin.name;
      admin.email = updateData.email || admin.email;
      admin.phone = updateData.phone || admin.phone;
      await admin.save();
      return { profile: { ...admin.toObject(), role: userToken.role }, message: "Profile updated successfully!" };
    }

    // Legacy fallback
    const profile = await this.profileModel
      .findOneAndUpdate({}, updateData, { upsert: true, new: true })
      .exec();
    return { profile, message: "Profile updated successfully!" };
  }
}
