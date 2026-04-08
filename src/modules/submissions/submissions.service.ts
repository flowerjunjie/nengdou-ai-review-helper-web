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

    // 查找是否已有提交
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
      });

      // 更新作业统计
      await this.assignmentModel.findByIdAndUpdate(assignmentId, {
        $inc: { totalSubmissions: 1, submittedSubmissions: isDraft ? 0 : 1 },
      });
    }

    return submission;
  }

  async getMySubmission(assignmentId: string, studentId: string) {
    return this.submissionModel.findOne({
      assignmentId: new Types.ObjectId(assignmentId),
      studentId: new Types.ObjectId(studentId),
    });
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
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ submittedAt: -1 });

    return { items, total, page, limit };
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

    submission.teacherScore = reviewDto.score;
    submission.teacherReviewContent = reviewDto.content;
    submission.teacherReviewedBy = new Types.ObjectId(teacherId);
    submission.teacherReviewedAt = new Date();
    submission.status = 'teacher_reviewed';

    await submission.save();

    // 更新作业统计
    await this.assignmentModel.findByIdAndUpdate(submission.assignmentId, {
      $inc: { gradedSubmissions: 1, pendingSubmissions: -1 },
    });

    return submission;
  }
}
