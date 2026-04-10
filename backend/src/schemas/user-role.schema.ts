import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRoleDocument = UserRole & Document;

@Schema({ timestamps: true })
export class UserRole {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;
}

export const UserRoleSchema = SchemaFactory.createForClass(UserRole);

// 复合唯一索引：防止重复分配
UserRoleSchema.index({ userId: 1, roleId: 1 }, { unique: true });
// 单字段索引：用户查询
UserRoleSchema.index({ userId: 1 });
// 单字段索引：角色查询
UserRoleSchema.index({ roleId: 1 });
