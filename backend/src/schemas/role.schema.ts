import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true, collection: 'roles' })
export class Role {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  code: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: [Types.ObjectId], ref: 'Menu', default: [] })
  menuIds: Types.ObjectId[];

  @Prop({ default: false })
  isSystem: boolean;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop()
  remark?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
