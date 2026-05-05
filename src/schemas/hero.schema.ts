import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Hero extends Document {
  @Prop()
  title: string;

  @Prop()
  subtitle: string;

  @Prop()
  backgroundImage: string;

  @Prop({ type: Object })
  content: any;
}

export const HeroSchema = SchemaFactory.createForClass(Hero);
