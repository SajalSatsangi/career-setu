import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoursesService } from './courses.service';

describe('CoursesService', () => {
  let service: CoursesService;

  const prismaMock = {
    course: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    courseEnrollment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const course = {
    id: 'course-123',
    title: 'Frontend Foundations',
    description: 'Build accessible interfaces.',
    category: 'Web development',
    level: 'Beginner',
    published: true,
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [CoursesService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(CoursesService);
  });

  it('lists published courses for students', async () => {
    prismaMock.course.findMany.mockResolvedValue([course]);

    await expect(service.list()).resolves.toEqual([course]);
    expect(prismaMock.course.findMany).toHaveBeenCalledWith({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('rejects enrollment in an unpublished or missing course', async () => {
    prismaMock.course.findFirst.mockResolvedValue(null);

    await expect(service.enroll('user-123', 'course-123')).rejects.toThrow(
      NotFoundException,
    );
    expect(prismaMock.courseEnrollment.create).not.toHaveBeenCalled();
  });

  it('creates a student enrollment with zero progress', async () => {
    prismaMock.course.findFirst.mockResolvedValue(course);
    const enrollment = { id: 'enrollment-123', progress: 0, course };
    prismaMock.courseEnrollment.create.mockResolvedValue(enrollment);

    await expect(service.enroll('user-123', 'course-123')).resolves.toEqual(enrollment);
    expect(prismaMock.courseEnrollment.create).toHaveBeenCalledWith({
      data: { userId: 'user-123', courseId: 'course-123' },
      include: { course: true },
    });
  });

  it('translates duplicate enrollment errors', async () => {
    prismaMock.course.findFirst.mockResolvedValue(course);
    prismaMock.courseEnrollment.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.enroll('user-123', 'course-123')).rejects.toThrow(
      ConflictException,
    );
  });
});