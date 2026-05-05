import { Controller, Post, Get, Delete, Body, Param, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BlogService } from './blog.service';

@Controller('blogs')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Post()
  @UseInterceptors(FileInterceptor('blogImage', {
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
      data.blogImage = file.filename;
    }
    // Parse JSON fields if they are strings (from form-data)
    if (typeof data.sectionTitles === 'string') {
      data.sectionTitles = JSON.parse(data.sectionTitles);
    }
    if (typeof data.content === 'string') {
      data.content = JSON.parse(data.content);
    }
    return this.blogService.create(data);
  }

  @Get()
  async findAll() {
    return this.blogService.findAll();
  }

  @Get('count/all')
  async countAll() {
    return this.blogService.countAll();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.blogService.delete(id);
  }
}
