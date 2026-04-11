import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiModel, AiModelDocument } from '../../schemas/ai-model.schema';
import axios from 'axios';

@Injectable()
export class AiModelsService {
  constructor(
    @InjectModel(AiModel.name) private aiModelModel: Model<AiModelDocument>,
  ) {}

  async findAll() {
    return this.aiModelModel.find().sort({ createdAt: -1 });
  }

  async findActive() {
    return this.aiModelModel.find({ status: 'active' });
  }

  async findByCode(code: string) {
    const model = await this.aiModelModel.findOne({ code });
    if (!model) throw new NotFoundException('AI模型不存在');
    return model;
  }

  async getDefault() {
    return this.aiModelModel.findOne({ isDefault: true, status: 'active' });
  }

  async update(code: string, updateData: any) {
    const model = await this.aiModelModel.findOneAndUpdate({ code }, updateData, { new: true }).select('-apiKey -secretKey -accessKey');
    if (!model) throw new NotFoundException('AI模型不存在');
    return model;
  }

  async setDefault(code: string) {
    await this.aiModelModel.updateMany({}, { isDefault: false });
    await this.aiModelModel.findOneAndUpdate({ code }, { isDefault: true });
    return { message: '设置成功' };
  }

  async testConnection(code: string) {
    const model = await this.findByCode(code);
    try {
      if (model.provider === 'DeepSeek') {
        await axios.get(`${model.baseUrl}/balance`, {
          headers: { Authorization: `Bearer ${model.apiKey}` },
        });
      }
      return { success: true, message: '连接成功' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async recordUsage(code: string, usage: { tokensUsed?: number }) {
    const update: any = { $inc: { totalUsage: 1 }, lastUsedAt: new Date() };
    if (usage.tokensUsed) {
      update.$inc.totalTokens = usage.tokensUsed;
    }
    await this.aiModelModel.findOneAndUpdate({ code }, update);
  }

  async initialize() {
    const defaultModels = [
      {
        code: 'deepseek',
        name: 'DeepSeek',
        provider: 'DeepSeek',
        modelName: 'deepseek-chat',
        baseUrl: 'https://api.deepseek.com/v1',
        apiKey: '',
        status: 'inactive',
        isDefault: true,
      },
      {
        code: 'doubao',
        name: '豆包',
        provider: 'ByteDance',
        modelName: 'doubao-pro-32k-240615',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey: '',
        status: 'inactive',
        isDefault: false,
      },
    ];

    for (const model of defaultModels) {
      await this.aiModelModel.findOneAndUpdate(
        { code: model.code },
        model,
        { upsert: true, new: true },
      );
    }
    return { message: '初始化成功' };
  }
}
