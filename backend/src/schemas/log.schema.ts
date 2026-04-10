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

// 单字段索引：用户查询
LogSchema.index({ userId: 1 });
// 单字段索引：级别查询（用于筛选）
LogSchema.index({ level: 1 });
// 单字段索引：创建时间（用于排序和范围查询）
LogSchema.index({ createdAt: -1 });
// 复合索引：用户+时间（用于用户日志历史）
LogSchema.index({ userId: 1, createdAt: -1 });
