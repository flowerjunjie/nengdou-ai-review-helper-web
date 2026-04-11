import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// 简单的内存存储，生产环境建议使用Redis
const passwordResetTokens = new Map<string, { userId: string; expires: Date }>();

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
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('两次输入的密码不一致');
    }

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

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      // 不暴露用户是否存在，返回相同的成功消息
      return {
        message: '如果该邮箱存在，我们将发送密码重置链接',
      };
    }

    // 生成重置token
    const token = this.jwtService.sign(
      { sub: user._id, type: 'password-reset' },
      { expiresIn: '1h' },
    );

    // 存储token（生产环境应该使用Redis并设置过期时间）
    passwordResetTokens.set(token, {
      userId: user._id.toString(),
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1小时过期
    });

    // TODO: 发送邮件（实际生产环境需要集成邮件服务）
    // 这里仅返回token用于演示
    return {
      message: '密码重置链接已发送到您的邮箱',
      // 注意：实际生产环境不应该返回token，这里仅用于测试
      token,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // 验证token
    const tokenData = passwordResetTokens.get(token);
    if (!tokenData || tokenData.expires < new Date()) {
      throw new BadRequestException('重置链接已过期或无效');
    }

    try {
      // 验证JWT token
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'password-reset') {
        throw new BadRequestException('无效的重置链接');
      }

      // 检查token是否匹配
      if (payload.sub !== tokenData.userId) {
        throw new BadRequestException('无效的重置链接');
      }

      // 更新密码
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await this.userModel.findByIdAndUpdate(tokenData.userId, {
        password: hashedPassword,
      });

      // 删除已使用的token
      passwordResetTokens.delete(token);

      return {
        message: '密码重置成功，请使用新密码登录',
      };
    } catch (error) {
      throw new BadRequestException('重置链接已过期或无效');
    }
  }
}