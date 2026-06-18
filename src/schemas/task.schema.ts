import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, default: 'Medium', enum: ['High', 'Medium', 'Low'] })
  priority!: 'High' | 'Medium' | 'Low';

  @Prop({
    required: true,
    default: 'Not Started',
    enum: ['Not Started', 'In Progress', 'Under Review', 'Completed', 'Blocked'],
  })
  status!: 'Not Started' | 'In Progress' | 'Under Review' | 'Completed' | 'Blocked';

  @Prop({ type: Date })
  deadline?: Date;

  @Prop({ type: Number, default: 0 })
  estimatedHours!: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignees!: Types.ObjectId[];

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progress!: number;

  @Prop({ type: Date, index: true })
  calendarDate?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', index: true })
  projectId?: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  hasQuery?: boolean;

  @Prop({ type: [{ filename: String, url: String }], default: [] })
  attachments?: { filename: string; url: string }[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);
