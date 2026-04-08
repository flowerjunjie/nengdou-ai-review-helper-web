import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiGradingService } from './ai-grading.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1')
@UseGuards(AuthGuard('jwt'))
export class AiGradingController {
  constructor(private aiGradingService: AiGradingService) {}

  @Post('ai-grading/submissions/:id')
  @Roles('teacher', 'student', 'superadmin')
  async gradeSubmission(@Body('submissionId') submissionId: string) {
    return this.aiGradingService.gradeSubmission(submissionId);
  }
}
