import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SubmissionsService } from './submissions.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1')
@UseGuards(AuthGuard('jwt'))
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  // 学生接口
  @Post('students/submissions/submit')
  @Roles('student')
  async submit(@Body() submitDto: any, @CurrentUser() user: any) {
    return this.submissionsService.submit(submitDto, user._id, user.name);
  }

  @Get('students/submissions/my/:assignmentId')
  @Roles('student')
  async getMySubmission(@Param('assignmentId') assignmentId: string, @CurrentUser() user: any) {
    return this.submissionsService.getMySubmission(assignmentId, user._id);
  }

  @Post('students/submissions/delete')
  @Roles('student')
  async deleteDraft(@Body('submissionId') submissionId: string, @CurrentUser() user: any) {
    return this.submissionsService.deleteDraft(submissionId, user._id);
  }

  // 教师接口
  @Get('teachers/submissions/list')
  @Roles('teacher', 'superadmin')
  async findForGrading(@Query() query: any) {
    return this.submissionsService.findForGrading(query);
  }

  @Get('teachers/submissions/detail/:id')
  @Roles('teacher', 'superadmin')
  async findById(@Param('id') id: string) {
    return this.submissionsService.findById(id);
  }

  @Post('teachers/submissions/review')
  @Roles('teacher', 'superadmin')
  async submitReview(@Body() reviewDto: any, @CurrentUser() user: any) {
    return this.submissionsService.submitReview(reviewDto.submissionId, reviewDto, user._id);
  }
}
