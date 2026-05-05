import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hero } from '../schemas/hero.schema';

@Injectable()
export class HeroService {
  constructor(@InjectModel(Hero.name) private heroModel: Model<Hero>) {}

  async getHero() {
    return this.heroModel.findOne().exec();
  }

  async updateHero(data: any) {
    return this.heroModel.findOneAndUpdate({}, data, {
      upsert: true,
      new: true,
    }).exec();
  }
}
