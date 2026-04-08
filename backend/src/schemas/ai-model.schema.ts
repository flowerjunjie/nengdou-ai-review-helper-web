import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AiModelDocument = AiModel & Document;

@Schema({ timestamps: true, collection: 'ai_models' })
export class AiModel {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  provider: string;

  @Prop({ required: true })
  modelName: string;

  @Prop()
  baseUrl: string;

  @Prop()
  apiKey: string;

  @Prop()
  accessKey?: string;

  @Prop()
  secretKey?: string;

  @Prop({ enum: ['active', 'inactive'], default: 'inactive' })
  status: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: 0 })
  totalUsage: number;

  @Prop({ default: 0 })
  totalTokens: number;

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ default: 0 })
  lastBalance: number;

  @Prop({ default: 'CNY' })
  balanceCurrency: string;

  @Prop({ type: Date })
  lastBalanceCheck?: Date;
}

export const AiModelSchema = SchemaFactory.createForClass(AiModel);
