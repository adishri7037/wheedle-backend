import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Blog } from '../schemas/blog.schema';
import slugify from 'slugify';

@Injectable()
export class BlogService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<Blog>) {}

  async create(data: any) {
    if (data.category === 'comprehensive' && data.title) {
      data.slug = slugify(data.title, { lower: true });
    }
    const newBlog = new this.blogModel(data);
    return newBlog.save();
  }

  async findAll() {
    return this.blogModel.find().exec();
  }

  async findBySlug(slug: string) {
    const blog = await this.blogModel.findOne({ slug }).exec();
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog;
  }

  async delete(id: string) {
    return this.blogModel.findByIdAndDelete(id).exec();
  }

  async countAll() {
    return this.blogModel.countDocuments().exec();
  }
}
