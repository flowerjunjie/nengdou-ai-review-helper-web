import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from '../../schemas/assignment.schema';
import { Class, ClassDocument } from '../../schemas/class.schema';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<AssignmentDocument>,
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
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
    const { page = 1, limit = 10, search, status } = query;

    const classes = await this.classModel.find().select('_id');
    const classIds = classes.map(c => c._id);
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

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const assignment = await this.assignmentModel.findById(id).populate('classes', 'name');
    if (!assignment) throw new NotFoundException('作业不存在');
    return assignment;
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
    const assignment = await this.assignmentModel.findById(id);
    if (!assignment) throw new NotFoundException('作业不存在');

    return {
      total: assignment.totalSubmissions,
      submitted: assignment.submittedSubmissions,
      graded: assignment.gradedSubmissions,
      pending: assignment.pendingSubmissions,
    };
  }

  async getStudentStatistics(studentId: string, classId?: string) {
    const filter: any = { status: 'published', isDeleted: false };
    if (classId) {
      filter.classes = { $in: [new Types.ObjectId(classId)] };
    }

    const assignments = await this.assignmentModel.find(filter);
    return {
      totalAssignments: assignments.length,
      pendingAssignments: assignments.filter(a => new Date(a.endDate) > new Date()).length,
      completedAssignments: assignments.filter(a => new Date(a.endDate) <= new Date()).length,
    };
  }
}
