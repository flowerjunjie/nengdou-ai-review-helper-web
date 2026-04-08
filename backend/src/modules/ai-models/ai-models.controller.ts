import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiModelsService } from './ai-models.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1/admin/ai-models')
@UseGuards(AuthGuard('jwt'))
export class AiModelsController {
  constructor(private aiModelsService: AiModelsService) {}

  @Get()
  @Roles('superadmin')
  async findAll() {
    return this.aiModelsService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.aiModelsService.findActive();
  }

  @Get(':code')
  @Roles('superadmin')
  async findByCode(@Param('code') code: string) {
    return this.aiModelsService.findByCode(code);
  }

  @Put(':code')
  @Roles('superadmin')
  async update(@Param('code') code: string, @Body() updateData: any) {
    return this.aiModelsService.update(code, updateData);
  }

  @Post(':code/default')
  @Roles('superadmin')
  async setDefault(@Param('code') code: string) {
    return this.aiModelsService.setDefault(code);
  }

  @Post(':code/test')
  @Roles('superadmin')
  async test(@Param('code') code: string) {
    return this.aiModelsService.testConnection(code);
  }

  @Post('initialize')
  @Roles('superadmin')
  async initialize() {
    return this.aiModelsService.initialize();
  }
}
