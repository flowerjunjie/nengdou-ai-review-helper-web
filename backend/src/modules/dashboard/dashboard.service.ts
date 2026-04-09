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
      performanceAnalysis: {
        excellentCount: 0,
        goodCount: 0,
        passCount: 0,
        classRanking: 'N/A',
        perfectScoreCount: 0,
      },
      pendingAssignmentsList: [],
      recentSubmissions: [],
    };
  }

  async getTeacherPerformanceSummary(teacherId: string) {
    const assignments = await this.assignmentModel.find({ teacherId: new Types.ObjectId(teacherId) });
    const submissions = await this.submissionModel.find({
      assignmentId: { $in: assignments.map(a => a._id) },
    });

    const aiReviewed = submissions.filter(s => s.aiScore !== undefined);
    const teacherReviewed = submissions.filter(s => s.teacherScore !== undefined);

    const avgAiScore = aiReviewed.length > 0
      ? aiReviewed.reduce((sum, s) => sum + (s.aiScore || 0), 0) / aiReviewed.length
      : 0;
    const avgTeacherScore = teacherReviewed.length > 0
      ? teacherReviewed.reduce((sum, s) => sum + (s.teacherScore || 0), 0) / teacherReviewed.length
      : 0;

    return {
      totalReviews: teacherReviewed.length,
      aiReviews: aiReviewed.length,
      avgAiScore: avgAiScore.toFixed(1),
      avgTeacherScore: avgTeacherScore.toFixed(1),
      scoreDifference: (avgTeacherScore - avgAiScore).toFixed(1),
    };
  }

  async getTeacherQuickActions(teacherId: string) {
    const pendingCount = await this.submissionModel.countDocuments({
      assignmentId: { $in: (await this.assignmentModel.find({ teacherId: new Types.ObjectId(teacherId) })).map(a => a._id) },
      status: { $in: ['submitted', 'ai_reviewed'] },
    });

    return {
      actions: [
        { id: 'review', label: '待批改作业', count: pendingCount, icon: 'Edit' },
        { id: 'create', label: '创建作业', count: 0, icon: 'Plus' },
        { id: 'students', label: '学生管理', count: 0, icon: 'User' },
      ],
    };
  }

  async getStudentStudyRecommendations(studentId: string) {
    const submissions = await this.submissionModel.find({
      studentId: new Types.ObjectId(studentId),
    }).sort({ createdAt: -1 }).limit(5);

    const recommendations = [];
    const avgScore = submissions.length > 0
      ? submissions.reduce((sum, s) => sum + (s.teacherScore || s.aiScore || 0), 0) / submissions.length
      : 0;

    if (avgScore < 60) {
      recommendations.push({
        type: 'improvement',
        title: '加强基础知识',
        description: '您的平均成绩偏低，建议复习相关知识点',
      });
    } else if (avgScore > 85) {
      recommendations.push({
        type: 'advance',
        title: '挑战更高难度',
        description: '您的表现非常出色，可以尝试挑战更高难度的作业',
      });
    }

    recommendations.push({
      type: 'general',
      title: '及时完成作业',
      description: '请在截止日期前按时提交作业',
    });

    return { recommendations };
  }

  async getLearningProgress(studentId: string) {
    const submissions = await this.submissionModel.find({
      studentId: new Types.ObjectId(studentId),
    });

    if (submissions.length === 0) {
      return { progress: 0, trend: 'stable', totalSubmissions: 0, avgScore: 0 };
    }

    const completedSubmissions = submissions.filter(s => s.status === 'teacher_reviewed').length;
    const totalSubmissions = submissions.length;
    const progress = Math.round((completedSubmissions / totalSubmissions) * 100);

    const scoredSubmissions = submissions.filter(s => s.teacherScore !== undefined || s.aiScore !== undefined);
    const avgScore = scoredSubmissions.length > 0
      ? scoredSubmissions.reduce((sum, s) => sum + (s.teacherScore || s.aiScore || 0), 0) / scoredSubmissions.length
      : 0;

    const recentSubmissions = await this.submissionModel.find({
      studentId: new Types.ObjectId(studentId),
    }).sort({ submittedAt: -1 }).limit(5);

    const recentScores = recentSubmissions
      .filter(s => s.teacherScore !== undefined || s.aiScore !== undefined)
      .map(s => s.teacherScore || s.aiScore || 0);

    let trend = 'stable';
    if (recentScores.length >= 2) {
      const recentAvg = recentScores.slice(0, Math.ceil(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(recentScores.length / 2);
      const olderAvg = recentScores.slice(Math.ceil(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(recentScores.length / 2);
      if (recentAvg > olderAvg) trend = 'up';
      else if (recentAvg < olderAvg) trend = 'down';
    }

    return {
      progress,
      trend,
      totalSubmissions,
      completedSubmissions,
      avgScore: Number(avgScore.toFixed(1)),
    };
  }

  async getAchievements(studentId: string) {
    const submissions = await this.submissionModel.find({
      studentId: new Types.ObjectId(studentId),
      status: 'teacher_reviewed',
    });

    const badges = [];
    let totalPoints = 0;

    const perfectScores = submissions.filter(s => s.teacherScore === 100);
    if (perfectScores.length >= 1) {
      badges.push({ id: 'perfect_1', name: '满分作业', description: '获得一次满分作业', icon: 'Star' });
      totalPoints += 10;
    }
    if (perfectScores.length >= 5) {
      badges.push({ id: 'perfect_5', name: '五次满分', description: '获得五次满分作业', icon: 'StarFilled' });
      totalPoints += 50;
    }

    const highScores = submissions.filter(s => (s.teacherScore || 0) >= 90);
    if (highScores.length >= 10) {
      badges.push({ id: 'excellence_10', name: '优秀学员', description: '获得十次优秀作业', icon: 'Trophy' });
      totalPoints += 100;
    }

    const submissionCount = submissions.length;
    if (submissionCount >= 1) {
      badges.push({ id: 'first_submit', name: '初次提交', description: '完成第一次作业提交', icon: 'Medal' });
      totalPoints += 5;
    }
    if (submissionCount >= 10) {
      badges.push({ id: 'active_10', name: '积极分子', description: '完成十次作业提交', icon: 'Medal' });
      totalPoints += 30;
    }
    if (submissionCount >= 50) {
      badges.push({ id: 'active_50', name: '作业达人', description: '完成五十次作业提交', icon: 'GoldMedal' });
      totalPoints += 100;
    }

    return { badges, totalPoints };
  }
}
