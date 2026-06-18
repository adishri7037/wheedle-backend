import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RolePermission extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  tenantId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  roleId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  permissionId!: Types.ObjectId;
}


export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);

