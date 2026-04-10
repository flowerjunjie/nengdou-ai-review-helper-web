import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user._id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: any, @Body() updateData: UpdateUserDto) {
    return this.usersService.update(user._id, updateData);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
    return this.usersService.update(id, updateData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Post('batch-delete')
  async batchDelete(@Body('userIds') userIds: string[]) {
    return this.usersService.batchDelete(userIds);
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body('newPassword') newPassword: string) {
    return this.usersService.resetPassword(id, newPassword || '123456');
  }

  @Patch(':id/password')
  async updateUserPassword(
    @Param('id') id: string,
    @Body() passwordData: { oldPassword: string; newPassword: string },
  ) {
    return this.usersService.updatePassword(id, passwordData.oldPassword, passwordData.newPassword);
  }

  @Post('batch-import')
  async batchImport(@Body('users') users: CreateUserDto[]) {
    return this.usersService.batchImport(users);
  }
}