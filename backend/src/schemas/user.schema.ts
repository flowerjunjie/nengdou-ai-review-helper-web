import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    enum: ['superadmin', 'teacher', 'student'],
    default: 'student'
  })
  role: string;

  @Prop({
    required: true,
    enum: ['active', 'inactive', 'locked'],
    default: 'active'
  })
  status: string;

  @Prop({ unique: true, sparse: true })
  studentId?: string;

  @Prop()
  phone?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: false })
  mustChangePassword: boolean;

  @Prop({ type: Date })
  firstLoginAt?: Date;

  @Prop({ type: Date })
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// 单字段索引：邮箱查询（用于登录）
UserSchema.index({ email: 1 });
// 单字段索引：用户名查询（用于登录）
UserSchema.index({ username: 1 });
// 单字段索引：角色查询
UserSchema.index({ role: 1 });
// 单字段索引：状态查询
UserSchema.index({ status: 1 });
// 单字段索引：学号查询（用于学生）
UserSchema.index({ studentId: 1 });
// 复合索引：角色+状态查询（用于列表筛选）
UserSchema.index({ role: 1, status: 1 });