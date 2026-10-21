
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '../generated/prisma/client';

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.name === undefined) {
      throw new BadRequestException(
        'At least one profile field must be provided',
      );
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { name: dto.name },
        select: profileSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User profile not found');
      }

      throw error;
    }
  }

  listAllUsers() {
    return this.prisma.user.findMany({
      select: profileSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateUserRole(adminId: string, userId: string, role: UserRole) {
    if (adminId === userId) {
      throw new BadRequestException('Administrators cannot change their own role');
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { role },
        select: profileSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }
}
