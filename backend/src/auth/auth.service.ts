import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { UserRole } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        role: UserRole.STUDENT,
      },
    });

    return this.createAuthResponse(
      user.id,
      user.email,
      user.role,
    );
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const passwordValid = await this.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    return this.createAuthResponse(
      user.id,
      user.email,
      user.role,
    );
  }

  async requestPasswordReset(dto: ForgotPasswordDto) {
    const genericMessage = 'If an account exists for this email, password reset instructions will be sent.';
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return { message: genericMessage };

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    if (process.env.NODE_ENV !== 'production') {
      return { message: genericMessage, developmentToken: rawToken };
    }

    return { message: genericMessage };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!tokenRecord || tokenRecord.usedAt || tokenRecord.expiresAt <= new Date()) {
      throw new UnauthorizedException('This password reset link is invalid or expired');
    }

    const passwordHash = await this.hashPassword(dto.password);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: tokenRecord.userId }, data: { passwordHash } }),
      this.prisma.passwordResetToken.update({ where: { id: tokenRecord.id }, data: { usedAt: new Date() } }),
    ]);

    return { message: 'Password reset successful. You can now sign in.' };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        'User no longer exists',
      );
    }

    return user;
  }

  private async createAuthResponse(
    userId: string,
    email: string,
    role: UserRole,
  ) {
    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
    };

    const accessToken = await this.jwtService.signAsync(
      payload,
    );

    const user = await this.getCurrentUser(userId);

    return {
      accessToken,
      user,
    };
  }
}