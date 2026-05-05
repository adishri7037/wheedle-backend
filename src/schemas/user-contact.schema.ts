import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserContact extends Document {
  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  ip: string;
}

export const UserContactSchema = SchemaFactory.createForClass(UserContact);
