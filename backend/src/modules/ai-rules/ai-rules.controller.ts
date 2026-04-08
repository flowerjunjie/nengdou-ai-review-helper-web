import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiRulesService } from './ai-rules.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('v1/ai-rules')
@UseGuards(AuthGuard('jwt'))
export class AiRulesController {
  constructor(private aiRulesService: AiRulesService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.aiRulesService.findAll(query);
  }

  @Get('available/list')
  async findAvailable() {
    return this.aiRulesService.findAvailable();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.aiRulesService.findById(id);
  }

  @Post()
  async create(@Body() createDto: any, @CurrentUser() user: any) {
    return this.aiRulesService.create(createDto, user._id);
  }

  @Post(':id/update')
  async update(@Param('id') id: string, @Body() updateDto: any) {
    return this.aiRulesService.update(id, updateDto);
  }

  @Post(':id/delete')
  async delete(@Param('id') id: string) {
    return this.aiRulesService.delete(id);
  }

  @Post(':id/copy')
  async copy(@Param('id') id: string, @CurrentUser() user: any) {
    return this.aiRulesService.copy(id, user._id);
  }
}
