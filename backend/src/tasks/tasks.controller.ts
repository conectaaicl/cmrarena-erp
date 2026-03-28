import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tareas' })
  findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.tasksService.findAll(tenantId, status, clientId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear tarea' })
  create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(tenantId, userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar tarea' })
  update(
    @CurrentUser('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateTaskDto>,
  ) {
    return this.tasksService.update(tenantId, id, dto as any);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar tarea' })
  remove(@CurrentUser('tenantId') tenantId: string, @Param('id') id: string) {
    return this.tasksService.remove(tenantId, id);
  }
}
