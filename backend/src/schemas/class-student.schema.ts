import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ClassStudentDocument = ClassStudent & Document;

@Schema({ timestamps: true, collection: 'class_students' })
export class ClassStudent {
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  classId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  studentName: string;

  @Prop()
  studentNumber?: string;

  @Prop()
  avatar?: string;

  @Prop({ enum: ['teacher', 'code'], default: 'code' })
  joinMethod: string;

  @Prop({ enum: ['active', 'inactive', 'left'], default: 'active' })
  status: string;

  @Prop({ default: 0 })
  totalSubmissions: number;

  @Prop({ type: Date })
  lastSubmissionTime?: Date;
}

export const ClassStudentSchema = SchemaFactory.createForClass(ClassStudent);