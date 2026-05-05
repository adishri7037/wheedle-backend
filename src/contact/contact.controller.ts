import { Controller, Post, Get, Body } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  @Post()
  async create(@Body() body: any) {
    return this.contactService.create(body);
  }

  @Get()
  async findAll() {
    return this.contactService.findAll();
  }
}
