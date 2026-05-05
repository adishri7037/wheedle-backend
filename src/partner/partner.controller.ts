import { Controller, Post, Get, Delete, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PartnerService } from './partner.service';

@Controller('partner')
export class PartnerController {
  constructor(private partnerService: PartnerService) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async create(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    const data = { ...body };
    if (file) {
      data.logo = file.filename;
    }
    return this.partnerService.create(data);
  }

  @Get()
  async findAll() {
    return this.partnerService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.partnerService.delete(id);
  }
}
