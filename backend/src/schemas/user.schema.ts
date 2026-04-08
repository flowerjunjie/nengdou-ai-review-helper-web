import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    enum: ['superadmin', 'teacher', 'student'],
    default: 'student'
  })
  role: string;

  @Prop({
    required: true,
    enum: ['active', 'inactive', 'locked'],
    default: 'active'
  })
  status: string;

  @Prop({ unique: true, sparse: true })
  studentId?: string;

  @Prop()
  phone?: string;

  @Prop()
  avatar?: string;

  @Prop({ default: false })
  mustChangePassword: boolean;

  @Prop({ type: Date })
  firstLoginAt?: Date;

  @Prop({ type: Date })
  lastLogin?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);