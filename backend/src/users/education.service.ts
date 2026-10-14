import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEducationDto } from './dto/education/create-education.dto';
import { UpdateEducationDto } from './dto/education/update-education.dto';

@Injectable()
export class EducationService {
  constructor(private readonly prisma: PrismaService) {}

  private validateYears(data: {
    startYear: number;
    endYear?: number | null;
    isCurrent: boolean;
  }) {
    if (data.isCurrent && data.endYear != null) {
      throw new BadRequestException(
        'Current education must not have an end year',
      );
    }

    if (
      !data.isCurrent &&
      data.endYear != null &&
      data.endYear < data.startYear
    ) {
      throw new BadRequestException(
        'End year must be greater than or equal to start year',
      );
    }
  }

  async create(userId: string, dto: CreateEducationDto) {
    const data = {
      startYear: dto.startYear,
      endYear: dto.endYear ?? null,
      isCurrent: dto.isCurrent ?? false,
    };
    this.validateYears(data);

    return this.prisma.education.create({
      data: {
        userId,
        degree: dto.degree,
        institution: dto.institution,
        fieldOfStudy: dto.fieldOfStudy,
        startYear: data.startYear,
        endYear: data.endYear,
        isCurrent: data.isCurrent,
      },
    });
  }

  async list(userId: string) {
    return this.prisma.education.findMany({
      where: { userId },
      orderBy: { startYear: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    const record = await this.prisma.education.findFirst({
      where: { id, userId },
    });
    if (!record) throw new NotFoundException('Education record not found');
    return record;
  }

  async update(userId: string, id: string, dto: UpdateEducationDto) {
    const existing = await this.get(userId, id);
    const merged = {
      startYear: dto.startYear ?? existing.startYear,
      endYear: dto.endYear === undefined ? existing.endYear : dto.endYear,
      isCurrent: dto.isCurrent ?? existing.isCurrent,
    };
    this.validateYears(merged);

    try {
      return await this.prisma.education.update({
        where: { id, userId },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Education record not found');
      }
      throw error;
    }
  }

  async remove(userId: string, id: string) {
    try {
      return await this.prisma.education.delete({
        where: { id, userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Education record not found');
      }
      throw error;
    }
  }
}
