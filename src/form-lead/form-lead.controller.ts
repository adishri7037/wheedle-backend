import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';
import { FormLeadService } from './form-lead.service';

@Controller('formleads')
export class FormLeadController {
  constructor(private formLeadService: FormLeadService) {}

  @Post()
  async create(@Body() body: any) {
    return this.formLeadService.create(body);
  }

  @Get()
  async findAll() {
    return this.formLeadService.findAll();
  }

  @Get('count/all')
  async countAll() {
    return this.formLeadService.countAll();
  }

  @Put(':id')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.formLeadService.updateStatus(id, status);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.formLeadService.delete(id);
  }
}
