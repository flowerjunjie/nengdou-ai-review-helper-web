import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesService } from './roles.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1/permissions/roles')
@UseGuards(AuthGuard('jwt'))
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @Roles('superadmin')
  async findAll(@Query() query: any) {
    return this.rolesService.findAll(query);
  }

  @Get(':id')
  @Roles('superadmin')
  async findById(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Get(':id/with-menus')
  @Roles('superadmin')
  async findByIdWithMenus(@Param('id') id: string) {
    return this.rolesService.findByIdWithMenus(id);
  }

  @Post()
  @Roles('superadmin')
  async create(@Body() createDto: any) {
    return this.rolesService.create(createDto);
  }

  @Put(':id')
  @Roles('superadmin')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.rolesService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('superadmin')
  async delete(@Param('id') id: string) {
    return this.rolesService.delete(id);
  }

  @Put(':id/menus')
  @Roles('superadmin')
  async assignMenus(@Param('id') id: string, @Body('menuIds') menuIds: string[]) {
    return this.rolesService.assignMenus(id, menuIds);
  }
}
