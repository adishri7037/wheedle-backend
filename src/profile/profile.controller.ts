import { Controller, Get, Put, Body } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  async getProfile() {
    return this.profileService.getProfile();
  }

  @Put()
  async updateProfile(@Body() body: any) {
    return this.profileService.updateProfile(body);
  }
}
