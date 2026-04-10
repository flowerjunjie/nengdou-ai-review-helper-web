import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubmissionDocument = Submission & Document;

@Schema({ timestamps: true, collection: 'submissions' })
export class Submission {
  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true })
  assignmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  studentName: string;

  @Prop()
  content: string;

  @Prop({ type: [{ fileName: String, fileUrl: String, fileSize: Number, fileType: String }], default: [] })
  attachments: any[];

  @Prop({ enum: ['draft', 'submitted', 'ai_reviewed', 'teacher_reviewed'], default: 'draft' })
  status: string;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ default: 1 })
  submissionCount: number;

  @Prop()
  aiScore?: number;

  @Prop()
  aiReviewContent?: string;

  @Prop({ type: Date })
  aiReviewedAt?: Date;

  @Prop({ type: Object, default: null })
  aiReviewMetadata?: any;

  @Prop()
  teacherScore?: number;

  @Prop()
  teacherReviewContent?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  teacherReviewedBy?: Types.ObjectId;

  @Prop({ type: Date })
  teacherReviewedAt?: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// 复合唯一索引：防止同一学生对同一作业多次提交
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
// 复合索引：按作业和状态查询（用于统计）
SubmissionSchema.index({ assignmentId: 1, status: 1 });
// 单字段索引：学生查询自己的提交
SubmissionSchema.index({ studentId: 1 });
// 单字段索引：班级提交查询
SubmissionSchema.index({ classId: 1 });
// 单字段索引：按状态查询
SubmissionSchema.index({ status: 1 });
// 单字段索引：提交时间查询（用于排序）
SubmissionSchema.index({ submittedAt: 1 });
