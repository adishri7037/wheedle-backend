import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Job extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  location: string;

  @Prop()
  type: string;

  @Prop()
  description: string;

  @Prop()
  requirements: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
