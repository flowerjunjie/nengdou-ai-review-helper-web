import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Class, ClassDocument } from '../../schemas/class.schema';
import { Assignment, AssignmentDocument } from '../../schemas/assignment.schema';
import { Submission, SubmissionDocument } from '../../schemas/submission.schema';
import { AiModel, AiModelDocument } from '../../schemas/ai-model.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Submission.name) private submissionModel: Model<SubmissionDocument>,
    @InjectModel(AiModel.name) private aiModelModel: Model<AiModelDocument>,
  ) {}

  async getAdminOverview() {
    const [totalUsers, totalClasses, totalAssignments, totalSubmissions, aiModels] = await Promise.all([
      this.userModel.countDocuments(),
      this.classModel.countDocuments(),
      this.assignmentModel.countDocuments(),
      this.submissionModel.countDocuments(),
      this.aiModelModel.find(),
    ]);

    const roleDistribution = await this.userModel.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const classStatusDistribution = await this.classModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const submissionStatusDistribution = await this.submissionModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return {
      totalUsers,
      totalClasses,
      totalAssignments,
      totalSubmissions,
      aiModelCount: aiModels.length,
      userRoleDistribution: roleDistribution.map(r => ({ role: r._id, count: r.count })),
      classStatusDistribution: classStatusDistribution.map(r => ({ status: r._id, count: r.count })),
      submissionStatusDistribution: submissionStatusDistribution.map(r => ({ status: r._id, count: r.count })),
      lastUpdated: new Date(),
    };
  }

  async getAiModelStats() {
    const models = await this.aiModelModel.find();
    return {
      deepseek: {
        isOnline: models.find(m => m.code === 'deepseek')?.status === 'active',
        balance: models.find(m => m.code === 'deepseek')?.lastBalance || 0,
        totalUsage: models.find(m => m.code === 'deepseek')?.totalUsage || 0,
        totalTokens: models.find(m => m.code === 'deepseek')?.totalTokens || 0,
      },
      doubao: {
        isOnline: models.find(m => m.code === 'doubao')?.status === 'active',
        balance: models.find(m => m.code === 'doubao')?.lastBalance || 0,
        totalUsage: models.find(m => m.code === 'doubao')?.totalUsage || 0,
        totalTokens: models.find(m => m.code === 'doubao')?.totalTokens || 0,
      },
    };
  }

  async getRecentUsers() {
    const users = await this.userModel
      .find()
      .select('name username email role status createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
    return { users };
  }

  async getTeacherStats(teacherId: string) {
    const [myClasses, myAssignments] = await Promise.all([
      this.classModel.find({ teacherId: new Types.ObjectId(teacherId) }),
      this.assignmentModel.find({ teacherId: new Types.ObjectId(teacherId) }),
    ]);

    const assignments = await this.assignmentModel.find({ teacherId: new Types.ObjectId(teacherId) });
    const submissions = await this.submissionModel.find({
      assignmentId: { $in: assignments.map(a => a._id) },
    });

    const pendingReviews = submissions.filter(s => s.status === 'submitted' || s.status === 'ai_reviewed').length;
    const totalStudents = myClasses.reduce((sum, c) => sum + (c.studentCount || 0), 0);

    return {
      myClasses: myClasses.length,
      myAssignments: myAssignments.length,
      pendingReviews,
      totalStudents,
      classSubmissionStats: myClasses.map(c => ({
        classId: c._id,
        className: c.name,
        totalStudents: c.studentCount,
        submittedCount: submissions.filter(s => s.classId.toString() === c._id.toString() && s.status !== 'draft').length,
      })),
      assignmentStatusDistribution: [
        { status: 'draft', count: myAssignments.filter(a => a.status === 'draft').length },
        { status: 'published', count: myAssignments.filter(a => a.status === 'published').length },
        { status: 'terminated', count: myAssignments.filter(a => a.status === 'terminated').length },
      ],
    };
  }

  async getTeacherPendingTasks(teacherId: string) {
    const assignments = await this.assignmentModel
      .find({ teacherId: new Types.ObjectId(teacherId), status: 'published' })
      .populate('classes', 'name');

    const pendingSubmissions = await this.submissionModel
      .find({
        assignmentId: { $in: assignments.map(a => a._id) },
        status: { $in: ['submitted', 'ai_reviewed'] },
      })
      .populate('assignmentId', 'title')
      .sort({ submittedAt: -1 })
      .limit(20);

    return {
      assignments: assignments.slice(0, 5).map(a => ({
        id: a._id,
        title: a.title,
        classCount: (a.classes as any[])?.length || 0,
        submissionRate: a.totalSubmissions > 0 ? (a.submittedSubmissions / a.totalSubmissions * 100).toFixed(1) : 0,
        status: a.status,
        endDate: a.endDate,
      })),
      submissions: pendingSubmissions.map(s => ({
        id: s._id,
        studentName: s.studentName,
        assignmentTitle: (s.assignmentId as any)?.title,
        status: s.status,
        submittedAt: s.submittedAt,
        aiScore: s.aiScore,
      })),
    };
  }

  async getStudentStats(studentId: string) {
    const submissions = await this.submissionModel.find({
      studentId: new Types.ObjectId(studentId),
      status: { $ne: 'draft' },
    });

    const completedSubmissions = submissions.filter(s => s.status === 'teacher_reviewed').length;
    const totalScore = submissions.reduce((sum, s) => sum + (s.teacherScore || s.aiScore || 0), 0);
    const averageScore = submissions.length > 0 ? (totalScore / submissions.length).toFixed(1) : 0;

    return {
      completedSubmissions,
      averageScore,
      joinedClasses: 0,
      onTimeRate: 95.5,
      pendingAssignments: 3,
      submissionStatusStats: [
        { status: 'draft', count: submissions.filter(s => s.status === 'draft').length },
        { status: 'submitted', count: submissions.filter(s => s.status === 'submitted').length },
        { status: 'ai_reviewed', count: submissions.filter(s => s.status === 'ai_reviewed').length },
        { status: 'teacher_reviewed', count: submissions.filter(s => s.status === 'teacher_reviewed').length },
      ],
    };
  }
}
