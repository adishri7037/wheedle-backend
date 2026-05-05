import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'live_leads' })
export class LiveLead extends Document {
  @Prop()
  userType: string;

  @Prop()
  service: string;

  @Prop()
  subRequirement: string;

  @Prop()
  requirement: string;

  @Prop()
  name: string;

  @Prop()
  mobile: string;

  @Prop()
  email: string;

  @Prop()
  address: string;
}

export const LiveLeadSchema = SchemaFactory.createForClass(LiveLead);
