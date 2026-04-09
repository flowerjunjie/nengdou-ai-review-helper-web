import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ timestamps: true, collection: 'logs' })
export class Log {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  username: string;

  @Prop()
  ip: string;

  @Prop()
  method: string;

  @Prop()
  endpoint: string;

  @Prop()
  statusCode: number;

  @Prop()
  userAgent: string;

  @Prop({ type: Object })
  requestBody: any;

  @Prop()
  responseTime: number;

  @Prop({ enum: ['info', 'warning', 'error'], default: 'info' })
  level: string;
}

export const LogSchema = SchemaFactory.createForClass(Log);
