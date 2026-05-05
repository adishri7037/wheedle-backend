import { Controller, Get, Put, Body } from '@nestjs/common';
import { HeroService } from './hero.service';

@Controller('hero')
export class HeroController {
  constructor(private heroService: HeroService) {}

  @Get()
  async getHero() {
    return this.heroService.getHero();
  }

  @Put()
  async updateHero(@Body() body: any) {
    return this.heroService.updateHero(body);
  }
}
