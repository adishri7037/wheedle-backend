import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Testimonial extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  role: string;

  @Prop()
  content: string;

  @Prop()
  image: string;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);
