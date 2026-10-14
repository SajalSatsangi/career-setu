import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/skills/create-skill.dto';
import { UpdateSkillDto } from './dto/skills/update-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSkillDto) {
    try {
      return await this.prisma.userSkill.create({
        data: {
          userId,
          name: dto.name,
          proficiency: dto.proficiency ?? 'BEGINNER',
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This skill has already been added');
      }
      throw error;
    }
  }

  async list(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async get(userId: string, id: string) {
    const skill = await this.prisma.userSkill.findFirst({
      where: { id, userId },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  async update(userId: string, id: string, dto: UpdateSkillDto) {
    await this.get(userId, id);

    try {
      return await this.prisma.userSkill.update({
        where: { id, userId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.proficiency !== undefined
            ? { proficiency: dto.proficiency }
            : {}),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Skill not found');
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This skill has already been added');
      }

      throw error;
    }
  }

  async remove(userId: string, id: string) {
    try {
      return await this.prisma.userSkill.delete({
        where: { id, userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Skill not found');
      }
      throw error;
    }
  }
}
