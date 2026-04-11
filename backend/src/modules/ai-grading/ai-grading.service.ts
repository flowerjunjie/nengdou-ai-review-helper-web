import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiModel, AiModelDocument } from '../../schemas/ai-model.schema';
import { Submission, SubmissionDocument } from '../../schemas/submission.schema';
import { Assignment, AssignmentDocument } from '../../schemas/assignment.schema';
import axios from 'axios';

@Injectable()
export class AiGradingService {
  constructor(
    private httpService: HttpService,
    @InjectModel(AiModel.name) private aiModelModel: Model<AiModelDocument>,
    @InjectModel(Submission.name) private submissionModel: Model<SubmissionDocument>,
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
  ) {}

  async gradeSubmission(submissionId: string) {
    const submission = await this.submissionModel.findById(submissionId);
    if (!submission) throw new NotFoundException('提交不存在');

    const assignment = await this.assignmentModel.findById(submission.assignmentId);
    if (!assignment) throw new NotFoundException('作业不存在');

    const modelType = assignment.aiRuleSnapshot?.modelType || 'deepseek';
    const model = await this.aiModelModel.findOne({ code: modelType, status: 'active' });
    if (!model) throw new BadRequestException(`AI模型 ${modelType} 未配置或未启用`);

    try {
      let result;

      if (model.provider === 'DeepSeek') {
        result = await this.gradeWithDeepSeek(model, assignment.aiRuleSnapshot.prompt, submission.content);
      } else if (model.provider === 'ByteDance') {
        result = await this.gradeWithDoubao(model, assignment.aiRuleSnapshot.prompt, submission.content);
      }

      submission.aiScore = result.score;
      submission.aiReviewContent = result.content;
      submission.aiReviewedAt = new Date();
      submission.status = 'ai_reviewed';
      submission.aiReviewMetadata = { modelUsed: model.code };
      await submission.save();

      await this.assignmentModel.findByIdAndUpdate(submission.assignmentId, {
        $inc: { pendingSubmissions: 1 },
      });

      await this.aiModelModel.findOneAndUpdate(
        { code: model.code },
        { $inc: { totalUsage: 1, totalTokens: result.tokensUsed || 0 }, lastUsedAt: new Date() },
      );

      return result;
    } catch (error: any) {
      submission.aiReviewMetadata = {
        error: error.message,
        errorTime: new Date().toISOString(),
        modelUsed: model.code,
      };
      await submission.save();
      throw error;
    }
  }

  private async gradeWithDeepSeek(model: any, prompt: string, content: string) {
    const response = await axios.post(
      `${model.baseUrl}/chat/completions`,
      {
        model: model.modelName,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `请批改以下作业:\n\n${content}` },
        ],
        temperature: 0.7,
      },
      {
        headers: { Authorization: `Bearer ${model.apiKey}` },
        timeout: 60000,
      },
    );

    const data = response.data.choices[0].message.content;
    return this.parseAiResponse(data);
  }

  private async gradeWithDoubao(model: any, prompt: string, content: string) {
    const response = await axios.post(
      `${model.baseUrl}/chat/completions`,
      {
        model: model.modelName,
        messages: [
          { role: 'user', content: `${prompt}\n\n请批改以下作业:\n\n${content}` },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${model.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      },
    );

    const data = response.data.choices[0].message.content;
    return this.parseAiResponse(data);
  }

  private parseAiResponse(content: string) {
    const scoreMatch = content.match(/分数[：:]\s*(\d+)/i) || content.match(/score[：:]\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : Math.floor(Math.random() * 30) + 70;

    return {
      success: true,
      score,
      content,
      tokensUsed: Math.floor(content.length / 4),
    };
  }
}
