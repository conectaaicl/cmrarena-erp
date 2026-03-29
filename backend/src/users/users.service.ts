import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  private select = {
    id: true, email: true, firstName: true, lastName: true,
    role: true, isActive: true, lastLoginAt: true, createdAt: true, avatarUrl: true,
  };

  async create(tenantId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email ya registrado en esta empresa');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

    const created = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
      },
      select: this.select,
    });

    // Enviar credenciales por email (no bloqueante)
    this.email.sendWelcomeEmail({
      to: dto.email.toLowerCase(),
      firstName: dto.firstName,
      tenantName: tenant?.name || 'ERP',
      tempPassword: dto.password,
    }).catch(() => {}); // ignorar error de email para no bloquear la respuesta

    return created;
  }

  async findAll(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: this.select,
      orderBy: { firstName: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: this.select,
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(tenantId: string, id: string, dto: UpdateUserDto) {
    await this.findOne(tenantId, id);
    const data: any = { ...dto };
    if (dto.password) {
      data.passwordHash = await bcrypt.hash(dto.password, 12);
      delete data.password;
    }
    return this.prisma.user.update({ where: { id }, data, select: this.select });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: this.select,
    });
  }
}
