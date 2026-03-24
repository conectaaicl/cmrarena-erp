import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

// In-memory brute force tracker (use Redis in production for multi-instance)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async login(dto: LoginDto, ip: string) {
    const attemptKey = `${ip}:${dto.email}`;
    this.checkBruteForce(attemptKey);

    // Find tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug, isActive: true },
    });
    if (!tenant) throw new NotFoundException('Empresa no encontrada');

    // Find user
    const user = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, email: dto.email.toLowerCase(), isActive: true },
    });

    // Verify password — always compare to prevent timing attacks
    const dummyHash = '$2b$12$dummy.hash.to.prevent.timing.attacks.xxxxxxxxxxxxxxxxxx';
    const valid = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await bcrypt.compare(dto.password, dummyHash);

    if (!user || !valid) {
      this.recordFailedAttempt(attemptKey);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Reset attempts on success
    loginAttempts.delete(attemptKey);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, tenant.id, user.role, user.email);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: tenant.id,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          taxRate: Number(tenant.taxRate),
        },
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findFirst({
        where: { id: payload.sub, isActive: true },
      });
      if (!user || !user.refreshToken) throw new UnauthorizedException();

      const rtValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!rtValid) throw new UnauthorizedException('Refresh token inválido');

      // Rotate token
      return this.generateTokens(user.id, user.tenantId, user.role, user.email);
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Contraseña actual incorrecta');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Contraseña actualizada correctamente' };
  }

  private async generateTokens(userId: string, tenantId: string, role: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, tenantId, role, email },
        {
          secret: this.config.get('JWT_SECRET'),
          expiresIn: this.config.get('JWT_ACCESS_EXPIRES', '15m'),
        },
      ),
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get('JWT_REFRESH_EXPIRES', '7d'),
        },
      ),
    ]);

    const hashedRt = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRt },
    });

    return { accessToken, refreshToken };
  }

  private checkBruteForce(key: string) {
    const record = loginAttempts.get(key);
    if (!record) return;

    if (record.lockedUntil > Date.now()) {
      const remaining = Math.ceil((record.lockedUntil - Date.now()) / 1000);
      throw new ForbiddenException(
        `Demasiados intentos fallidos. Espera ${remaining} segundos antes de intentar de nuevo.`,
      );
    }
  }

  private recordFailedAttempt(key: string) {
    const record = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
    record.count++;

    // Lock after 5 failed attempts
    if (record.count >= 5) {
      // Progressive lockout: 1 min, 5 min, 15 min
      const lockDuration = record.count >= 10 ? 15 * 60000 : record.count >= 7 ? 5 * 60000 : 60000;
      record.lockedUntil = Date.now() + lockDuration;
    }

    loginAttempts.set(key, record);

    // Clean up old entries every 100 insertions
    if (loginAttempts.size > 1000) {
      const now = Date.now();
      for (const [k, v] of loginAttempts.entries()) {
        if (v.lockedUntil < now && v.count < 5) loginAttempts.delete(k);
      }
    }
  }
}
