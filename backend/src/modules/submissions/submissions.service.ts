import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Submission, SubmissionDocument } from '../../schemas/submission.schema';
import { Assignment, AssignmentDocument } from '../../schemas/assignment.schema';

@Injectable()
export class SubmissionsService {
  constructor(
    @InjectModel(Submission.name) private submissionModel: Model<SubmissionDocument>,
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
  ) {}

  async submit(submitDto: any, studentId: string, studentName: string) {
    const { assignmentId, classId, content, attachments, isDraft } = submitDto;

    let submission = await this.submissionModel.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
    });

    if (submission) {
      if (submission.status === 'teacher_reviewed') {
        throw new BadRequestException('作业已被教师批改，无法修改');
      }
      submission.content = content;
      submission.attachments = attachments || [];
      if (!isDraft) {
        submission.status = 'submitted';
        submission.submittedAt = new Date();
        submission.submissionCount += 1;
      }
      await submission.save();
    } else {
      submission = await this.submissionModel.create({
        assignmentId: new Types.ObjectId(assignmentId),
        classId: new Types.ObjectId(classId),
        studentId: new Types.ObjectId(studentId),
        studentName,
        content,
        attachments: attachments || [],
        status: isDraft ? 'draft' : 'submitted',
        submittedAt: isDraft ? null : new Date(),
        submissionCount: 1,
      });

      await this.assignmentModel.findByIdAndUpdate(assignmentId, {
        $inc: { totalSubmissions: 1, submittedSubmissions: isDraft ? 0 : 1 },
      });
    }

    const submissionObj = submission.toObject() as any;

    return {
      id: submission._id.toString(),
      assignmentId: submission.assignmentId.toString(),
      studentId: submission.studentId.toString(),
      status: submission.status,
      submittedAt: submission.submittedAt,
      updatedAt: submissionObj.updatedAt,
      isDraft: submission.status === 'draft',
      submissionCount: submission.submissionCount || 1,
    };
  }

  async getMySubmission(assignmentId: string, studentId: string) {
    const submission = await this.submissionModel.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
    });

    if (!submission) {
      return { assignment: null, submission: null, aiReview: null, teacherReview: null };
    }

    const assignment = await this.assignmentModel.findById(assignmentId).select('title description endDate teacherName aiRuleSnapshot status');
    const submissionObj = submission.toObject() as any;

    return {
      assignment: assignment ? {
        id: assignment._id.toString(),
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.endDate,
        maxScore: 100,
        teacherName: assignment.teacherName,
        aiRule: assignment.aiRuleSnapshot,
        status: assignment.status,
      } : null,
      submission: {
        id: submission._id.toString(),
        content: submission.content,
        attachments: submission.attachments || [],
        status: submission.status,
        submittedAt: submission.submittedAt,
        updatedAt: submissionObj.updatedAt,
        createdAt: submissionObj.createdAt,
        isDraft: submission.status === 'draft',
        submissionCount: submission.submissionCount || 1,
      },
      aiReview: submission.aiScore !== undefined ? {
        content: submission.aiReviewContent,
        score: submission.aiScore,
        reviewedAt: submission.aiReviewedAt,
        aiReviewMetadata: submission.aiReviewMetadata,
      } : null,
      teacherReview: submission.teacherScore !== undefined ? {
        content: submission.teacherReviewContent,
        score: submission.teacherScore,
        reviewedAt: submission.teacherReviewedAt,
      } : null,
    };
  }

  async deleteDraft(submissionId: string, studentId: string) {
    const submission = await this.submissionModel.findOne({
      _id: new Types.ObjectId(submissionId),
      studentId: new Types.ObjectId(studentId),
      status: 'draft',
    });
    if (!submission) throw new NotFoundException('草稿不存在或无法删除');
    await submission.deleteOne();
    return { message: '删除成功' };
  }

  async findForGrading(query: any) {
    const { page = 1, limit = 10, assignmentId, classId, status } = query;
    const filter: any = {};
    if (assignmentId) filter.assignmentId = new Types.ObjectId(assignmentId);
    if (classId) filter.classId = new Types.ObjectId(classId);
    if (status) filter.status = status;

    const total = await this.submissionModel.countDocuments(filter);
    const items = await this.submissionModel
      .find(filter)
      .populate('assignmentId', 'title')
      .populate('studentId', 'name studentNumber')
      .populate('classId', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ submittedAt: -1 });

    // 转换数据结构以匹配前端期望
    const transformedItems = items.map(item => {
      const obj = item.toObject() as any;
      return {
        _id: obj._id.toString(),
        assignmentId: obj.assignmentId?._id?.toString() || obj.assignmentId?.toString() || '',
        assignmentTitle: obj.assignmentId?.title || '',
        studentId: obj.studentId?._id?.toString() || obj.studentId?.toString() || '',
        studentName: obj.studentId?.name || obj.studentName || '',
        studentNumber: obj.studentId?.studentNumber || '',
        classId: obj.classId?._id?.toString() || obj.classId?.toString() || '',
        className: obj.classId?.name || obj.className || '',
        content: obj.content,
        status: obj.status,
        submittedAt: obj.submittedAt,
        aiScore: obj.aiScore,
        aiReviewContent: obj.aiReviewContent,
        teacherScore: obj.teacherScore,
        teacherReviewContent: obj.teacherReviewContent,
        teacherReviewedAt: obj.teacherReviewedAt,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      };
    });

    return { items: transformedItems, total, page, limit };
  }

  async findById(id: string) {
    const submission = await this.submissionModel.findById(id)
      .populate('assignmentId', 'title description');
    if (!submission) throw new NotFoundException('提交不存在');
    return submission;
  }

  async submitReview(submissionId: string, reviewDto: any, teacherId: string) {
    const submission = await this.submissionModel.findById(submissionId);
    if (!submission) throw new NotFoundException('提交不存在');

    submission.teacherScore = reviewDto.teacherScore ?? reviewDto.score;
    submission.teacherReviewContent = reviewDto.teacherReviewContent ?? reviewDto.content;
    submission.teacherReviewedBy = new Types.ObjectId(teacherId);
    submission.teacherReviewedAt = new Date();
    submission.status = 'teacher_reviewed';

    await submission.save();

    await this.assignmentModel.findByIdAndUpdate(submission.assignmentId, {
      $inc: { gradedSubmissions: 1, pendingSubmissions: -1 },
    });

    return submission;
  }
}
