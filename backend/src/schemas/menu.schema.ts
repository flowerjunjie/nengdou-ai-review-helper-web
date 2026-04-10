import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({ timestamps: true, collection: 'menus' })
export class Menu {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  code?: string;

  @Prop()
  path?: string;

  @Prop()
  component?: string;

  @Prop()
  redirect?: string;

  @Prop({ enum: ['menu', 'button'], default: 'menu' })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Menu' })
  parentId?: Types.ObjectId;

  @Prop()
  icon?: string;

  @Prop({ default: 0 })
  sort: number;

  @Prop({ default: false })
  hidden: boolean;

  @Prop({ enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ type: Object, default: null })
  meta?: any;

  @Prop({ default: false })
  isSystem: boolean;
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

// 单字段索引：父菜单查询（用于树形结构）
MenuSchema.index({ parentId: 1 });
// 单字段索引：类型查询
MenuSchema.index({ type: 1 });
// 单字段索引：状态查询
MenuSchema.index({ status: 1 });
// 单字段索引：权限编码查询
MenuSchema.index({ code: 1 });
// 复合索引：类型+状态（用于菜单树查询）
MenuSchema.index({ type: 1, status: 1 });
