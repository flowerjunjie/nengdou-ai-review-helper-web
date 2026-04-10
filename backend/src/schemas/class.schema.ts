import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClassDocument = Class & Document;

@Schema({ timestamps: true, collection: 'classes' })
export class Class {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, length: 8 })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: ['active', 'inactive', 'disbanded'], default: 'active' })
  status: string;

  @Prop({ default: 100 })
  maxStudents: number;

  @Prop({ default: 0 })
  studentCount: number;
}

export const ClassSchema = SchemaFactory.createForClass(Class);

// 单字段索引：教师查询班级
ClassSchema.index({ teacherId: 1 });
// 单字段索引：班级状态查询
ClassSchema.index({ status: 1 });
// 单字段索引：邀请码查询（唯一）
ClassSchema.index({ code: 1 });
// 复合索引：状态+教师（用于教师筛选班级）
ClassSchema.index({ status: 1, teacherId: 1 });