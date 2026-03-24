import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  private uploadDir: string;

  constructor(
    private filesService: FilesService,
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.uploadDir = config.get('UPLOAD_DIR', './uploads');
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir archivo (logo, certificado, etc.)' })
  async upload(
    @CurrentUser('tenantId') tenantId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.filesService.uploadFile(file, tenantId, 'general');
    await this.prisma.file.create({
      data: {
        tenantId,
        name: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: result.storageKey,
        url: result.url,
        purpose: 'LOGO',
      },
    });
    return result;
  }

  @Public()
  @Get('*')
  @ApiOperation({ summary: 'Servir archivo estático' })
  serveFile(@Param('0') key: string, @Res() res: Response) {
    const filePath = path.join(this.uploadDir, key);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
    res.sendFile(path.resolve(filePath));
  }
}
