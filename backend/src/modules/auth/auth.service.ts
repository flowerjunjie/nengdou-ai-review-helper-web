import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(usernameOrEmailOrStudentId: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({
      $or: [
        { username: usernameOrEmailOrStudentId },
        { email: usernameOrEmailOrStudentId },
        { studentId: usernameOrEmailOrStudentId },
      ],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('账户已被禁用');
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.usernameOrEmailOrStudentId, loginDto.password);

    const payload = { sub: user._id, username: user.username, role: user.role };

    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign({ sub: user._id, type: 'refresh' }, { expiresIn: '7d' });

    // 更新最后登录时间
    await this.userModel.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    return {
      token,
      refreshToken,
      expiresIn: 900, // 15分钟
      userId: user._id,
      mustChangePassword: user.mustChangePassword || false,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userModel.findOne({
      $or: [
        { username: registerDto.username },
        { email: registerDto.email },
      ],
    });

    if (existingUser) {
      throw new BadRequestException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = new this.userModel({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name || registerDto.username,
      role: 'student', // 默认角色
      status: 'active',
    });

    await user.save();

    return {
      success: true,
      message: '注册成功',
      userId: user._id,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userModel.findById(payload.sub);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newPayload = { sub: user._id, username: user.username, role: user.role };
      const newToken = this.jwtService.sign(newPayload);

      return {
        token: newToken,
        expiresIn: 900,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('当前密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      mustChangePassword: false,
    });

    return { message: '密码修改成功' };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-password').exec();
    if (!user) {
      throw new BadRequestException('用户不存在');
    }
    return user;
  }
}