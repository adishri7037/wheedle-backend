import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  email!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, default: 'employee' })
  userType!: 'admin' | 'team-lead' | 'employee' | 'client';

  @Prop({ required: false })
  password?: string;

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @Prop({ required: false })
  phone?: string;
}


export const UserSchema = SchemaFactory.createForClass(User);


