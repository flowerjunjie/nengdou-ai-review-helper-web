import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('admin/dashboard/overview')
  @Roles('superadmin')
  async getAdminOverview() {
    return this.dashboardService.getAdminOverview();
  }

  @Get('admin/dashboard/ai-models')
  @Roles('superadmin')
  async getAiModelStats() {
    return this.dashboardService.getAiModelStats();
  }

  @Get('admin/dashboard/recent-users')
  @Roles('superadmin')
  async getRecentUsers() {
    return this.dashboardService.getRecentUsers();
  }

  @Get('admin/dashboard/health')
  @Roles('superadmin')
  async getHealth() {
    return { status: 'ok', timestamp: new Date() };
  }

  @Get('teacher/dashboard/stats')
  @Roles('teacher', 'superadmin')
  async getTeacherStats(@CurrentUser() user: any) {
    return this.dashboardService.getTeacherStats(user._id);
  }

  @Get('teacher/dashboard/pending-tasks')
  @Roles('teacher', 'superadmin')
  async getTeacherPendingTasks(@CurrentUser() user: any) {
    return this.dashboardService.getTeacherPendingTasks(user._id);
  }

  @Get('student/dashboard/stats')
  @Roles('student')
  async getStudentStats(@CurrentUser() user: any) {
    return this.dashboardService.getStudentStats(user._id);
  }

  @Get('student/dashboard/learning-progress')
  @Roles('student')
  async getLearningProgress(@CurrentUser() user: any) {
    return { progress: 65, trend: 'up' };
  }

  @Get('student/dashboard/achievements')
  @Roles('student')
  async getAchievements(@CurrentUser() user: any) {
    return { badges: [], totalPoints: 0 };
  }
}
