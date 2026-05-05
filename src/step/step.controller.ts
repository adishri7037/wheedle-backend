import { Controller, Post, Get, Delete, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { StepService } from './step.service';

@Controller('steps')
export class StepController {
  constructor(private stepService: StepService) {}

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
    return this.stepService.create(data);
  }

  @Get()
  async findAll() {
    return this.stepService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.stepService.delete(id);
  }
}
