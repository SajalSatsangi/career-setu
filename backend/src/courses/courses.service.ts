import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseActivityDto } from './dto/create-course-activity.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  list(publishedOnly = true) {
    return this.prisma.course.findMany({
      where: publishedOnly ? { published: true } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateCourseDto) {
    return this.prisma.course.create({ data: dto });
  }

  async publish(courseId: string) {
    try {
      return await this.prisma.course.update({
        where: { id: courseId },
        data: { published: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Course not found');
      }
      throw error;
    }
  }

  async enroll(userId: string, courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, published: true },
    });
    if (!course) throw new NotFoundException('Published course not found');

    try {
      return await this.prisma.courseEnrollment.create({
        data: { userId, courseId },
        include: { course: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You are already enrolled in this course');
      }
      throw error;
    }
  }

  listMyEnrollments(userId: string) {
    return this.prisma.courseEnrollment.findMany({
      where: { userId },
      include: { course: { include: { activities: { orderBy: { position: 'asc' } } } }, completions: true },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  listActivities(courseId: string) {
    return this.prisma.courseActivity.findMany({
      where: { courseId },
      orderBy: { position: 'asc' },
    });
  }

  async createActivity(courseId: string, dto: CreateCourseActivityDto) {
    try {
      return await this.prisma.courseActivity.create({
        data: {
          courseId,
          title: dto.title,
          description: dto.description,
          position: dto.position,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This activity position is already in use');
      }
      throw error;
    }
  }

  async completeActivity(userId: string, courseId: string, activityId: string) {
    const enrollment = await this.prisma.courseEnrollment.findFirst({
      where: { userId, courseId },
    });
    if (!enrollment) throw new NotFoundException('Course enrollment not found');

    const activity = await this.prisma.courseActivity.findFirst({
      where: { id: activityId, courseId },
    });
    if (!activity) throw new NotFoundException('Course activity not found');

    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.courseActivityCompletion.create({
          data: { enrollmentId: enrollment.id, activityId },
        });
        const totalActivities = await transaction.courseActivity.count({ where: { courseId } });
        const completedActivities = await transaction.courseActivityCompletion.count({
          where: { enrollmentId: enrollment.id },
        });
        const progress = totalActivities === 0
          ? 0
          : Math.round((completedActivities / totalActivities) * 100);

        return transaction.courseEnrollment.update({
          where: { id: enrollment.id },
          data: { progress },
          include: { course: true, completions: true },
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('This activity is already complete');
      }
      throw error;
    }
  }
}