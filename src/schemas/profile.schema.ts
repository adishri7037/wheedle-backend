import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Profile extends Document {
  @Prop()
  name: string;

  @Prop()
  bio: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ type: Object })
  socials: any;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
