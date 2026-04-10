import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from '../../schemas/assignment.schema';
import { Class, ClassDocument } from '../../schemas/class.schema';
import { ClassStudent, ClassStudentDocument } from '../../schemas/class-student.schema';
import { Submission, SubmissionDocument } from '../../schemas/submission.schema';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(ClassStudent.name) private classStudentModel: Model<ClassStudentDocument>,
    @InjectModel(Submission.name) private submissionModel: Model<SubmissionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findTeacherAssignments(teacherId: string, query: any) {
    const { page = 1, limit = 10, search, status } = query;
    const filter: any = { teacherId: new Types.ObjectId(teacherId), isDeleted: false };
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const total = await this.assignmentModel.countDocuments(filter);
    const items = await this.assignmentModel
      .find(filter)
      .populate('classes', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findStudentAssignments(studentId: string, query: any) {
    const { page = 1, limit = 10, search, businessStatus, classId } = query;
    const now = new Date();
    const studentObjectId = new Types.ObjectId(studentId);

    // 获取学生加入的班级ID列表
    const classStudentFilter: any = { studentId: studentObjectId, status: 'active' };
    if (classId) {
      classStudentFilter.classId = new Types.ObjectId(classId);
    }
    const studentClasses = await this.classStudentModel.find(classStudentFilter).select('classId');
    const classIds = studentClasses.map(sc => sc.classId);

    if (classIds.length === 0) {
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }

    const filter: any = {
      classes: { $in: classIds },
      status: 'published',
      isDeleted: false,
    };
    if (search) filter.title = { $regex: search, $options: 'i' };

    const total = await this.assignmentModel.countDocuments(filter);
    const items = await this.assignmentModel
      .find(filter)
      .populate('classes', 'name')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ endDate: 1 });

    // 获取每个作业的提交状态
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const submission = await this.submissionModel.findOne({
          assignmentId: item._id,
          studentId: studentObjectId,
        }).sort({ createdAt: -1 });

        const hasDraft = submission?.status === 'draft';
        const hasSubmitted = submission && submission.status !== 'draft';
        const isExpired = new Date(item.endDate) < now;

        let passFilter = true;
        if (businessStatus === 'todo') {
          passFilter = !hasSubmitted && !isExpired;
        } else if (businessStatus === 'completed') {
          passFilter = hasSubmitted;
        } else if (businessStatus === 'draft') {
          passFilter = hasDraft;
        } else if (businessStatus === 'expired') {
          passFilter = !hasSubmitted && isExpired;
        }

        // 获取班级名称和ID
        const classObj = item.classes as any;
        const assignmentClassId = classObj?._id ? classObj._id.toString() : (classIds[0] as any).toString();
        const className = classObj?.name || '';

        const itemObj = item.toObject() as any;
        return {
          id: item._id.toString(),  // 添加 id 字段（前端期望）
          _id: item._id,
          title: item.title,
          description: item.description,
          teacherId: item.teacherId?.toString(),
          teacherName: item.teacherName,
          startDate: item.startDate,
          endDate: item.endDate,
          status: item.status,
          allowAttachments: item.allowAttachments ?? true,
          hasDraft,
          hasSubmitted,
          isExpired,
          submissionStatus: submission?.status,
          submissionId: submission?._id?.toString(),
          canSubmit: !hasSubmitted && !isExpired,
          createdAt: itemObj.createdAt,
          classId: assignmentClassId,
          className,
          passFilter,
        };
      })
    );

    // 根据业务状态筛选
    let filteredItems = enrichedItems;
    if (businessStatus && businessStatus !== 'all') {
      filteredItems = enrichedItems.filter(item => item.passFilter);
    }

    // 移除 passFilter 字段
    const resultItems = filteredItems.map(({ passFilter, ...rest }) => rest);

    return { items: resultItems, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const assignment = await this.assignmentModel.findById(id).populate('classes', 'name');
    if (!assignment) throw new NotFoundException('作业不存在');

    const obj = assignment.toObject() as any;
    return {
      id: obj._id.toString(),
      _id: obj._id,
      title: obj.title,
      description: obj.description,
      teacherId: obj.teacherId?.toString(),
      teacherName: obj.teacherName,
      startDate: obj.startDate,
      endDate: obj.endDate,
      status: obj.status,
      allowAttachments: obj.allowAttachments ?? true,
      aiRuleSnapshot: obj.aiRuleSnapshot,
      terminatedReason: obj.terminatedReason,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      classes: obj.classes,
    };
  }

  async create(createDto: any, teacherId: string, teacherName: string) {
    const assignment = new this.assignmentModel({
      ...createDto,
      teacherId,
      teacherName,
    });
    await assignment.save();
    return assignment;
  }

  async update(id: string, updateData: any) {
    const assignment = await this.assignmentModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!assignment) throw new NotFoundException('作业不存在');
    return assignment;
  }

  async updateStatus(id: string, status: string, terminatedReason?: string) {
    const updateData: any = { status };
    if (status === 'terminated') {
      updateData.terminatedReason = terminatedReason;
    }
    return this.update(id, updateData);
  }

  async delete(id: string) {
    await this.assignmentModel.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() });
    return { message: '删除成功' };
  }

  async getAssignmentStudents(id: string, query: any) {
    const { page = 1, limit = 50 } = query;
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) throw new NotFoundException('作业不存在');

    // 获取班级中的所有学生
    const classStudents = await this.classStudentModel.find({
      classId: { $in: assignment.classes },
      status: 'active',
    });

    const studentIds = classStudents.map(cs => cs.studentId);

    // 获取这些学生的提交记录
    const submissions = await this.submissionModel.find({
      assignmentId: new Types.ObjectId(id),
      studentId: { $in: studentIds },
    });

    const submissionMap = new Map(
      submissions.map(s => [s.studentId.toString(), s])
    );

    // 获取学生详细信息
    const users = await this.userModel.find({
      _id: { $in: studentIds },
    }).select('name studentId');

    const userMap = new Map(
      users.map(u => [u._id.toString(), u])
    );

    // 获取学生信息
    const students = await Promise.all(
      classStudents.map(async (cs) => {
        const studentId = cs.studentId.toString();
        const submission = submissionMap.get(studentId);
        const user = userMap.get(studentId);
        const isExpired = new Date(assignment.endDate) < new Date();

        return {
          studentId,
          studentName: user?.name || '',
          studentNumber: user?.studentId || '',
          classId: cs.classId.toString(),
          status: submission?.status || 'not_submitted',
          submittedAt: submission?.submittedAt,
          content: submission?.content,
          aiScore: submission?.aiScore,
          teacherScore: submission?.teacherScore,
          isExpired,
        };
      })
    );

    // 分页
    const total = students.length;
    const start = (page - 1) * limit;
    const items = students.slice(start, start + limit);

    return { items, total, page, limit };
  }

  async getStudentStatistics(studentId: string, classId?: string) {
    const now = new Date();

    // 获取学生加入的班级ID列表
    const classStudentFilter: any = { studentId: new Types.ObjectId(studentId), status: 'active' };
    if (classId) {
      classStudentFilter.classId = new Types.ObjectId(classId);
    }
    const studentClasses = await this.classStudentModel.find(classStudentFilter).select('classId');
    const classIds = studentClasses.map(sc => sc.classId);

    if (classIds.length === 0) {
      return {
        totalAssignments: 0,
        submittedCount: 0,
        todoCount: 0,
        draftCount: 0,
        expiredCount: 0,
        reviewedCount: 0,
      };
    }

    const filter: any = {
      classes: { $in: classIds },
      status: 'published',
      isDeleted: false,
    };

    const assignments = await this.assignmentModel.find(filter);

    // 获取学生的所有提交记录
    const submissions = await this.submissionModel.find({
      studentId: new Types.ObjectId(studentId),
      assignmentId: { $in: assignments.map(a => a._id) },
    });

    let todoCount = 0;
    let expiredCount = 0;
    let draftCount = 0;
    let submittedCount = 0;
    let reviewedCount = 0;

    for (const assignment of assignments) {
      const submission = submissions.find(
        s => s.assignmentId.toString() === assignment._id.toString()
      );

      if (submission) {
        if (submission.status === 'draft') {
          draftCount++;
        } else if (submission.status === 'teacher_reviewed') {
          submittedCount++;
          reviewedCount++;
        } else {
          submittedCount++;
        }
      } else {
        // 没有提交记录，检查是否过期
        if (new Date(assignment.endDate) < now) {
          expiredCount++;
        } else {
          todoCount++;
        }
      }
    }

    return {
      totalAssignments: assignments.length,
      submittedCount,
      todoCount,
      draftCount,
      expiredCount,
      reviewedCount,
    };
  }
}
