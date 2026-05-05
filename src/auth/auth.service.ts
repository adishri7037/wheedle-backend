import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Admin } from '../schemas/admin.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, pass: string): Promise<any> {
    const admin = await this.adminModel.findOne({ email });
    if (admin && await bcrypt.compare(pass, admin.password)) {
      const { password, ...result } = admin.toObject();
      return result;
    }
    return null;
  }

  async login(email: string, pass: string) {
    const admin = await this.validateAdmin(email, pass);
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: admin.email, id: admin._id };
    return {
      message: 'Login success',
      token: this.jwtService.sign(payload),
    };
  }

  async verify(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return { message: 'Valid', id: decoded.id };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
