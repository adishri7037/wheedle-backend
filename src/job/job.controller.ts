import { Controller, Post, Get, Delete, Body, Param } from '@nestjs/common';
import { JobService } from './job.service';

@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) {}

  @Post()
  async create(@Body() body: any) {
    return this.jobService.create(body);
  }

  @Get()
  async findAll() {
    return this.jobService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.jobService.delete(id);
  }
}
