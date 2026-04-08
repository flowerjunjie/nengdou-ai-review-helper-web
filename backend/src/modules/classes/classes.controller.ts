import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClassesService } from './classes.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1/classes')
@UseGuards(AuthGuard('jwt'))
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  @Get('list')
  async findAll(@Query() query: any) {
    return this.classesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.classesService.findById(id);
  }

  @Post('create')
  @Roles('teacher', 'superadmin')
  async create(@Body() createClassDto: any, @CurrentUser() user: any) {
    return this.classesService.create(createClassDto, user._id);
  }

  @Post(':id/edit')
  @Roles('teacher', 'superadmin')
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.classesService.update(id, updateData);
  }

  @Post(':id/close')
  @Roles('teacher', 'superadmin')
  async close(@Param('id') id: string) {
    return this.classesService.close(id);
  }

  @Post(':id/regenerate-code')
  @Roles('teacher', 'superadmin')
  async regenerateCode(@Param('id') id: string) {
    return this.classesService.regenerateCode(id);
  }

  @Get(':id/students')
  async getStudents(@Param('id') id: string, @Query() query: any) {
    return this.classesService.getStudents(id, query);
  }

  @Post(':id/students')
  @Roles('teacher', 'superadmin')
  async addStudents(@Param('id') id: string, @Body('studentIds') studentIds: string[]) {
    return this.classesService.addStudents(id, studentIds);
  }

  @Post(':id/students/status')
  @Roles('teacher', 'superadmin')
  async updateStudentStatus(
    @Param('id') id: string,
    @Body() body: { studentIds: string[]; status: string },
  ) {
    return this.classesService.updateStudentStatus(id, body.studentIds, body.status);
  }

  @Post('join')
  @Roles('student')
  async joinClass(@Body('code') code: string, @CurrentUser() user: any) {
    return this.classesService.joinClass(code, user._id);
  }
}