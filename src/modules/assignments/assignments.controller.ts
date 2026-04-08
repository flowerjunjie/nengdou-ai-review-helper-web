import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AssignmentsService } from './assignments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class AssignmentsController {
  constructor(private assignmentsService: AssignmentsService) {}

  @Get('teacher/assignments')
  @Roles('teacher', 'superadmin')
  async findTeacherAssignments(@CurrentUser() user: any, @Query() query: any) {
    return this.assignmentsService.findTeacherAssignments(user._id, query);
  }

  @Get('teacher/assignments/:id')
  @Roles('teacher', 'superadmin')
  async findTeacherAssignment(@Param('id') id: string) {
    return this.assignmentsService.findById(id);
  }

  @Get('teacher/assignments/:id/students')
  @Roles('teacher', 'superadmin')
  async getAssignmentStudents(@Param('id') id: string, @Query() query: any) {
    return this.assignmentsService.getAssignmentStudents(id, query);
  }

  @Post('teacher/assignments')
  @Roles('teacher', 'superadmin')
  async create(@Body() createDto: any, @CurrentUser() user: any) {
    return this.assignmentsService.create(createDto, user._id, user.name);
  }

  @Post('teacher/assignments/:id/update')
  @Roles('teacher', 'superadmin')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.assignmentsService.update(id, updateData);
  }

  @Post('teacher/assignments/:id/status')
  @Roles('teacher', 'superadmin')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; terminatedReason?: string },
  ) {
    return this.assignmentsService.updateStatus(id, body.status, body.terminatedReason);
  }

  @Post('teacher/assignments/:id/delete')
  @Roles('teacher', 'superadmin')
  async delete(@Param('id') id: string) {
    return this.assignmentsService.delete(id);
  }

  @Get('student/assignments')
  @Roles('student')
  async findStudentAssignments(@CurrentUser() user: any, @Query() query: any) {
    return this.assignmentsService.findStudentAssignments(user._id, query);
  }

  @Get('student/assignments/:id')
  @Roles('student')
  async findStudentAssignment(@Param('id') id: string) {
    return this.assignmentsService.findById(id);
  }
}
