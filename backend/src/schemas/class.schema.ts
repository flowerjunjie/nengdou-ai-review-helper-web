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