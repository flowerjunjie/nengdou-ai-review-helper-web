import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Class, ClassDocument } from '../../schemas/class.schema';
import { ClassStudent, ClassStudentDocument } from '../../schemas/class-student.schema';
import { User, UserDocument } from '../../schemas/user.schema';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private classModel: Model<ClassDocument>,
    @InjectModel(ClassStudent.name) private classStudentModel: Model<ClassStudentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private generateCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  async findAll(query: any) {
    const { page = 1, limit = 10, search, status, teacherId } = query;
    const filter: any = {};

    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;
    if (teacherId) filter.teacherId = teacherId;

    const total = await this.classModel.countDocuments(filter);
    const items = await this.classModel
      .find(filter)
      .populate('teacherId', 'name username')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const classItem = await this.classModel.findById(id).populate('teacherId', 'name username');
    if (!classItem) throw new NotFoundException('班级不存在');
    return classItem;
  }

  async create(createClassDto: any, teacherId: string) {
    const code = createClassDto.code || this.generateCode();
    const existingCode = await this.classModel.findOne({ code });
    if (existingCode) throw new BadRequestException('邀请码已存在');

    const teacher = await this.userModel.findById(teacherId);

    const classItem = new this.classModel({
      ...createClassDto,
      code,
      teacherId,
      teacherName: teacher?.name,
    });
    await classItem.save();
    return { message: '创建成功', classId: classItem._id };
  }

  async update(id: string, updateData: any) {
    const classItem = await this.classModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!classItem) throw new NotFoundException('班级不存在');
    return classItem;
  }

  async close(id: string) {
    return this.update(id, { status: 'disbanded' });
  }

  async regenerateCode(id: string) {
    const newCode = this.generateCode();
    await this.classModel.findByIdAndUpdate(id, { code: newCode });
    return { message: '邀请码已更新', inviteCode: newCode };
  }

  async getStudents(classId: string, query: any) {
    const { page = 1, limit = 10, search, status } = query;
    const filter: any = { classId: new Types.ObjectId(classId) };
    if (search) filter.studentName = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const total = await this.classStudentModel.countDocuments(filter);
    const items = await this.classStudentModel
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ joinedAt: -1 });

    return { items, total, page, limit };
  }

  async addStudents(classId: string, studentIds: string[]) {
    const results = { success: [], failed: [] };
    for (const studentId of studentIds) {
      try {
        const student = await this.userModel.findById(studentId);
        if (!student) throw new Error('学生不存在');

        const existing = await this.classStudentModel.findOne({ classId: new Types.ObjectId(classId), studentId: new Types.ObjectId(studentId) });
        if (existing) throw new Error('学生已在班级中');

        await this.classStudentModel.create({
          classId: new Types.ObjectId(classId),
          studentId: new Types.ObjectId(studentId),
          studentName: student.name,
          avatar: student.avatar,
          joinMethod: 'teacher',
        });

        await this.classModel.findByIdAndUpdate(classId, { $inc: { studentCount: 1 } });
        results.success.push(studentId);
      } catch (error: any) {
        results.failed.push({ id: studentId, reason: error?.message || String(error) });
      }
    }
    return results;
  }

  async joinClass(code: string, studentId: string) {
    const classItem = await this.classModel.findOne({ code, status: 'active' });
    if (!classItem) throw new NotFoundException('班级不存在或已关闭');

    if (classItem.studentCount >= classItem.maxStudents) {
      throw new BadRequestException('班级人数已满');
    }

    const existing = await this.classStudentModel.findOne({
      classId: classItem._id,
      studentId: new Types.ObjectId(studentId),
    });
    if (existing) throw new BadRequestException('您已在该班级中');

    const student = await this.userModel.findById(studentId);

    await this.classStudentModel.create({
      classId: classItem._id,
      studentId: new Types.ObjectId(studentId),
      studentName: student?.name,
      avatar: student?.avatar,
      joinMethod: 'code',
    });

    await this.classModel.findByIdAndUpdate(classItem._id, { $inc: { studentCount: 1 } });

    return { message: '加入成功', classId: classItem._id };
  }

  async updateStudentStatus(classId: string, studentIds: string[], status: string) {
    await this.classStudentModel.updateMany(
      { classId: new Types.ObjectId(classId), studentId: { $in: studentIds.map(id => new Types.ObjectId(id)) } },
      { status }
    );
    return { message: '状态更新成功' };
  }

  async leaveClass(classId: string, studentId: string) {
    const classStudent = await this.classStudentModel.findOne({
      classId: new Types.ObjectId(classId),
      studentId: new Types.ObjectId(studentId),
    });

    if (!classStudent) {
      throw new NotFoundException('未找到该学生的班级关系');
    }

    await classStudent.deleteOne();
    await this.classModel.findByIdAndUpdate(classId, { $inc: { studentCount: -1 } });

    return { message: '退出成功' };
  }
}