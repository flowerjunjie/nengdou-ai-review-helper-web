import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRolesService } from './user-roles.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/permissions/user-roles')
@UseGuards(AuthGuard('jwt'))
export class UserRolesController {
  constructor(private userRolesService: UserRolesService) {}

  // Alias routes for "current" user - must be BEFORE parameterized routes
  @Get('users/current/permissions')
  async getCurrentUserPermissions(@CurrentUser() user: any) {
    return this.userRolesService.getUserPermissions(user._id);
  }

  @Get('users/current/menus')
  async getCurrentUserMenus(@CurrentUser() user: any) {
    return this.userRolesService.getUserMenus(user._id);
  }

  @Get('users/current/resources')
  async getCurrentUserResources(@CurrentUser() user: any) {
    return this.userRolesService.getUserResources(user._id);
  }

  @Get('users/:userId/roles')
  @Roles('superadmin')
  async getUserRoles(@Param('userId') userId: string) {
    return this.userRolesService.getUserRoles(userId);
  }

  @Put('users/:userId/roles')
  @Roles('superadmin')
  async assignRoles(@Param('userId') userId: string, @Body('roleIds') roleIds: string[]) {
    return this.userRolesService.assignRoles(userId, roleIds);
  }

  @Get('users/:userId/permissions')
  async getUserPermissions(@Param('userId') userId: string) {
    return this.userRolesService.getUserPermissions(userId);
  }

  @Get('users/:userId/menus')
  async getUserMenus(@Param('userId') userId: string) {
    return this.userRolesService.getUserMenus(userId);
  }

  @Get('users/:userId/resources')
  async getUserResources(@Param('userId') userId: string) {
    return this.userRolesService.getUserResources(userId);
  }
}
