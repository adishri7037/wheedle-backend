import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleName = 'Super Admin' | 'Admin' | 'Team Lead' | 'Employee' | 'Client';

@Schema({ timestamps: true })
export class Role extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  name!: RoleName;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  createdByUserId!: Types.ObjectId;
}


export const RoleSchema = SchemaFactory.createForClass(Role);

