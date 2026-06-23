import { Controller, Get, Post, Put, Body, UseGuards, Delete, Param } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  async create(@Body() createDto: any) {
    return this.invoicesService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.invoicesService.findAll();
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.invoicesService.update(id, updateDto);
  }
}
