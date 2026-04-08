import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiRule, AiRuleDocument } from '../../schemas/ai-rule.schema';

@Injectable()
export class AiRulesService {
  constructor(
    @InjectModel(AiRule.name) private aiRuleModel: Model<AiRuleDocument>,
  ) {}

  async findAll(query: any) {
    const { page = 1, limit = 10, search, modelType, status, visibility } = query;
    const filter: any = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (modelType) filter.modelType = modelType;
    if (status) filter.status = status;
    if (visibility) filter.visibility = visibility;

    const total = await this.aiRuleModel.countDocuments(filter);
    const items = await this.aiRuleModel
      .find(filter)
      .populate('createdBy', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return { items, total, page, limit };
  }

  async findById(id: string) {
    const rule = await this.aiRuleModel.findById(id);
    if (!rule) throw new NotFoundException('AI规则不存在');
    return rule;
  }

  async findAvailable() {
    return this.aiRuleModel.find({ status: 'active', visibility: { $in: ['public', 'system'] } });
  }

  async create(createDto: any, userId: string) {
    const rule = await this.aiRuleModel.create({
      ...createDto,
      createdBy: userId,
    });
    return rule;
  }

  async update(id: string, updateDto: any) {
    const rule = await this.aiRuleModel.findByIdAndUpdate(id, updateDto, { new: true });
    if (!rule) throw new NotFoundException('AI规则不存在');
    return rule;
  }

  async delete(id: string) {
    await this.aiRuleModel.findByIdAndDelete(id);
    return { message: '删除成功' };
  }

  async copy(id: string, userId: string) {
    const original = await this.findById(id);
    const copy = await this.aiRuleModel.create({
      name: `${original.name} (副本)`,
      description: original.description,
      modelType: original.modelType,
      prompt: original.prompt,
      visibility: 'private',
      createdBy: userId,
    });
    return copy;
  }
}
