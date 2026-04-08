import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findAll(query: any) {
    const { page = 1, limit = 10, search, role, status } = query;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const total = await this.userModel.countDocuments(filter);
    const items = await this.userModel
      .find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async findByUsername(username: string) {
    return this.userModel.findOne({ username }).select('-password');
  }

  async create(createUserDto: CreateUserDto) {
    const existing = await this.userModel.findOne({
      $or: [
        { username: createUserDto.username },
        { email: createUserDto.email },
      ],
    });
    if (existing) throw new BadRequestException('用户名或邮箱已存在');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);
    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    await user.save();
    return user;
  }

  async update(id: string, updateData: any) {
    const user = await this.userModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async delete(id: string) {
    await this.userModel.findByIdAndDelete(id);
    return { message: '删除成功' };
  }

  async resetPassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword });
    return { message: '密码重置成功' };
  }

  async batchImport(users: CreateUserDto[]) {
    const results = { success: [], failed: [] };
    for (const userDto of users) {
      try {
        const user = await this.create(userDto);
        results.success.push({ id: user._id, username: user.username });
      } catch (error: any) {
        results.failed.push({ username: userDto.username, reason: error?.message || String(error) });
      }
    }
    return results;
  }
}