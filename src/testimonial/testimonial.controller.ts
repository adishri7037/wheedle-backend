import { Controller, Post, Get, Delete, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TestimonialService } from './testimonial.service';

@Controller('testimonial')
export class TestimonialController {
  constructor(private testimonialService: TestimonialService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image', {
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
      data.image = file.filename;
    }
    return this.testimonialService.create(data);
  }

  @Get()
  async findAll() {
    return this.testimonialService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.testimonialService.delete(id);
  }
}
