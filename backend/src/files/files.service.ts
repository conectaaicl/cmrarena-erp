import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadDir: string;

  constructor(private config: ConfigService) {
    this.uploadDir = config.get('UPLOAD_DIR', './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, tenantId: string, purpose: string): Promise<{ url: string; storageKey: string }> {
    const ext = path.extname(file.originalname);
    const key = `${tenantId}/${purpose}/${Date.now()}${ext}`;
    const filePath = path.join(this.uploadDir, key);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(filePath, file.buffer);

    const baseUrl = this.config.get('APP_URL', 'http://localhost:3000');
    const url = `${baseUrl}/api/v1/files/${key}`;

    this.logger.log(`Archivo guardado: ${key}`);
    return { url, storageKey: key };
  }

  async deleteFile(storageKey: string): Promise<void> {
    const filePath = path.join(this.uploadDir, storageKey);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  async getFileBuffer(storageKey: string): Promise<Buffer | null> {
    const filePath = path.join(this.uploadDir, storageKey);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath);
  }
}
