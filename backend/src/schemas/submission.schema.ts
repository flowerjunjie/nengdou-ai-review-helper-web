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
