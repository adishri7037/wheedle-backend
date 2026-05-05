import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'live_support' })
export class LiveSupport extends Document {
  @Prop()
  company: string;

  @Prop()
  issue: string;

  @Prop()
  email: string;

  @Prop()
  mobile: string;
}

export const LiveSupportSchema = SchemaFactory.createForClass(LiveSupport);
