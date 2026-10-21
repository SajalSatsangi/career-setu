import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MentoringService } from './mentoring.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('MentoringService', () => {
  let service: MentoringService;

  const prismaMock = {
    mentorProfile: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    mentorshipRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MentoringService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
      ],
    }).compile();
    service = module.get(MentoringService);
  });

  it('lists public mentor profiles without private fields', async () => {
    prismaMock.mentorProfile.findMany.mockResolvedValue([]);

    await expect(service.listMentors()).resolves.toEqual([]);
    expect(prismaMock.mentorProfile.findMany).toHaveBeenCalledWith({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('creates a mentor profile with the authenticated owner', async () => {
    prismaMock.mentorProfile.create.mockResolvedValue({ id: 'profile-1' });

    await service.createProfile('mentor-1', {
      bio: 'Guidance for early careers.',
      expertise: ['TypeScript'],
      availability: 'Weekday evenings',
    });

    expect(prismaMock.mentorProfile.create).toHaveBeenCalledWith({
      data: {
        userId: 'mentor-1',
        bio: 'Guidance for early careers.',
        expertise: ['TypeScript'],
        availability: 'Weekday evenings',
      },
    });
  });

  it('rejects requests to users without mentor profiles', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue(null);

    await expect(service.requestMentorship('student-1', 'mentor-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prismaMock.mentorshipRequest.create).not.toHaveBeenCalled();
  });

  it('translates duplicate mentorship requests', async () => {
    prismaMock.mentorProfile.findUnique.mockResolvedValue({ userId: 'mentor-1' });
    prismaMock.mentorshipRequest.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.requestMentorship('student-1', 'mentor-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('updates only a pending request owned by the mentor', async () => {
    prismaMock.mentorshipRequest.findFirst.mockResolvedValue({
      id: 'request-1',
      mentorId: 'mentor-1',
      status: 'PENDING',
    });
    prismaMock.mentorshipRequest.update.mockResolvedValue({ id: 'request-1', status: 'ACCEPTED' });

    await service.updateRequestStatus('mentor-1', 'request-1', 'ACCEPTED');

    expect(prismaMock.mentorshipRequest.update).toHaveBeenCalledWith({
      where: { id: 'request-1' },
      data: { status: 'ACCEPTED' },
      include: { student: { select: { id: true, name: true } } },
    });
  });
});