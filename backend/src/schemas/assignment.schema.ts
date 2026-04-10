import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AssignmentDocument = Assignment & Document;

@Schema({ timestamps: true, collection: 'assignments' })
export class Assignment {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  teacherId: Types.ObjectId;

  @Prop({ trim: true })
  teacherName: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Class' }], default: [] })
  classes: Types.ObjectId[];

  @Prop({ type: Object, default: null })
  aiRuleSnapshot: any;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ enum: ['draft', 'published', 'terminated'], default: 'draft' })
  status: string;

  @Prop()
  terminatedReason?: string;

  @Prop({ default: true })
  allowAttachments: boolean;

  @Prop({ default: 50 })
  maxFileSize: number;

  @Prop({ type: [String], default: ['pdf', 'doc', 'docx', 'txt', 'md'] })
  allowedFileTypes: string[];

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 0 })
  totalSubmissions: number;

  @Prop({ default: 0 })
  submittedSubmissions: number;

  @Prop({ default: 0 })
  gradedSubmissions: number;

  @Prop({ default: 0 })
  pendingSubmissions: number;
}

export const AssignmentSchema = SchemaFactory.createForClass(Assignment);

// 单字段索引：教师查询自己的作业
AssignmentSchema.index({ teacherId: 1 });
// 单字段索引：班级作业查询
AssignmentSchema.index({ classes: 1 });
// 复合索引：活跃作业查询（按状态和结束时间）
AssignmentSchema.index({ status: 1, endDate: 1 });
// 单字段索引：软删除过滤
AssignmentSchema.index({ isDeleted: 1 });
