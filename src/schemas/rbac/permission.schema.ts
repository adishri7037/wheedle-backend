import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Permission extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  moduleKey!: string;

  @Prop({ required: true, index: true })
  permissionKey!: string;
}


export const PermissionSchema = SchemaFactory.createForClass(Permission);

