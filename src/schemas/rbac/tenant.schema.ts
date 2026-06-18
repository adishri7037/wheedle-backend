import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Tenant extends Document {
  @Prop({ required: true, unique: true })
  key!: string;

  @Prop({ required: true })
  name!: string;
}


export const TenantSchema = SchemaFactory.createForClass(Tenant);

