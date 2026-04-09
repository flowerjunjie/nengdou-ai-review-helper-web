import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LogsService } from './logs.service';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('v1/logs')
@UseGuards(AuthGuard('jwt'))
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Get()
  @Roles('superadmin')
  async findAll(@Query() query: any) {
    return this.logsService.findAll(query);
  }
}
