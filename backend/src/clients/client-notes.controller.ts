import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class CreateNoteDto {
  @IsString() @MinLength(1) content: string;
}

@ApiTags('Clients')
@ApiBearerAuth()
@Controller('clients/:clientId/notes')
export class ClientNotesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Notas de un cliente' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.prisma.clientNote.findMany({
      where: { tenantId, clientId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @ApiOperation({ summary: 'Agregar nota al cliente' })
  async create(
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('clientId') clientId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.prisma.clientNote.create({
      data: { tenantId, clientId, userId, content: dto.content },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
  }

  @Delete(':noteId')
  @ApiOperation({ summary: 'Eliminar nota' })
  async remove(
    @CurrentUser('tenantId') tenantId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.prisma.clientNote.deleteMany({ where: { id: noteId, tenantId } });
  }
}
