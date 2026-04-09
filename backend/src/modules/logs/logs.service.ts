import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from '../../schemas/log.schema';

@Injectable()
export class LogsService {
  constructor(
    @InjectModel(Log.name) private logModel: Model<LogDocument>,
  ) {}

  async findAll(query: any) {
    const { page = 1, limit = 10, username, method, endpoint, startDate, endDate } = query;
    const filter: any = {};

    if (username) filter.username = { $regex: username, $options: 'i' };
    if (method) filter.method = method;
    if (endpoint) filter.endpoint = { $regex: endpoint, $options: 'i' };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await this.logModel.countDocuments(filter);
    const items = await this.logModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(logData: any) {
    return this.logModel.create(logData);
  }
}
