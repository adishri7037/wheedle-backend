import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Blog extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  category: string;

  @Prop()
  description: string;

  @Prop()
  blogCategory: string;

  @Prop()
  blogImage: string;

  @Prop({ unique: true })
  slug: string;

  @Prop({ type: [String] })
  sectionTitles: string[];

  @Prop({ type: Object })
  content: any;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
