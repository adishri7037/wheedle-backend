import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Lead extends Document {
  @Prop({ required: true, unique: true })
  value: string;

  @Prop()
  type: string;

  @Prop({ default: 'Pending' })
  status: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
