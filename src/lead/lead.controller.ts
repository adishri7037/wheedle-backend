import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { LeadService } from './lead.service';

@Controller('leads')
export class LeadController {
  constructor(private leadService: LeadService) {}

  @Post()
  async create(@Body() body: any) {
    return this.leadService.create(body);
  }

  @Get()
  async findAll() {
    return this.leadService.findAll();
  }

  @Get('count/all')
  async countAll() {
    return this.leadService.countAll();
  }

  @Put(':id')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.leadService.updateStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.leadService.delete(id);
  }
}
