import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiRuleDocument = AiRule & Document;

@Schema({ timestamps: true, collection: 'ai_rules' })
export class AiRule {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ enum: ['deepseek', 'doubao'], default: 'deepseek' })
  modelType: string;

  @Prop({ required: true })
  prompt: string;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ enum: ['private', 'public', 'system'], default: 'private' })
  visibility: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ default: 0 })
  usageCount: number;
}

export const AiRuleSchema = SchemaFactory.createForClass(AiRule);
