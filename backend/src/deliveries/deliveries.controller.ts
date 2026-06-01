import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, UpdateDeliveryDto } from './dto/delivery.dto';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly service: DeliveriesService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.service.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateDeliveryDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateDeliveryDto) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Req() req: any, @Param('id') id: string) {
    return this.service.toggleStatus(req.user.tenantId, id);
  }

  @Post(':id/send')
  send(@Req() req: any, @Param('id') id: string) {
    return this.service.sendCredentials(req.user.tenantId, id, req.user.tenant);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}
