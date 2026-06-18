import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  projectName!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({
    required: true,
    default: 'Active',
    enum: ['Active', 'On Hold', 'Completed', 'Archived'],
  })
  status!: 'Active' | 'On Hold' | 'Completed' | 'Archived';

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignedClients!: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignedTeamMembers!: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
