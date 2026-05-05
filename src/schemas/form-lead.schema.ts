import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class FormLead extends Document {
  @Prop({ type: Object })
  data: any;

  @Prop({ default: 'Pending' })
  status: string;
}

export const FormLeadSchema = SchemaFactory.createForClass(FormLead);
