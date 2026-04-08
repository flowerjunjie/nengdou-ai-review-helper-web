import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenusService } from './menus.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1/permissions/menus')
@UseGuards(AuthGuard('jwt'))
export class MenusController {
  constructor(private menusService: MenusService) {}

  @Get()
  async findAll() {
    return this.menusService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.menusService.findById(id);
  }

  @Post()
  @Roles('superadmin')
  async create(@Body() createDto: any) {
    return this.menusService.create(createDto);
  }

  @Put(':id')
  @Roles('superadmin')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.menusService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('superadmin')
  async delete(@Param('id') id: string) {
    return this.menusService.delete(id);
  }
}
