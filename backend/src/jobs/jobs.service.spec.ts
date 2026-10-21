import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JobsService } from './jobs.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('JobsService', () => {
  let service: JobsService;

  const prismaMock = {
    job: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    jobApplication: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const job = {
    id: 'job-123',
    recruiterId: 'recruiter-123',
    companyName: 'Career Co',
    title: 'Frontend Engineer',
    description: 'Build products.',
    location: 'Remote',
    employmentType: 'FULL_TIME',
    requiredSkills: ['TypeScript'],
    status: 'OPEN',
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
      ],
    }).compile();
    service = module.get(JobsService);
  });

  it('lists only open jobs', async () => {
    prismaMock.job.findMany.mockResolvedValue([job]);

    await expect(service.listOpen()).resolves.toEqual([job]);
    expect(prismaMock.job.findMany).toHaveBeenCalledWith({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: { recruiter: { select: { id: true, name: true } } },
    });
  });

  it('scopes closing a job to its recruiter', async () => {
    prismaMock.job.update.mockResolvedValue({ ...job, status: 'CLOSED' });

    await service.close('recruiter-123', 'job-123');

    expect(prismaMock.job.update).toHaveBeenCalledWith({
      where: { id: 'job-123', recruiterId: 'recruiter-123' },
      data: { status: 'CLOSED' },
    });
  });

  it('lists jobs owned by a recruiter with application counts', async () => {
    prismaMock.job.findMany.mockResolvedValue([job]);

    await expect(service.listRecruiterJobs('recruiter-123')).resolves.toEqual([job]);
    expect(prismaMock.job.findMany).toHaveBeenCalledWith({
      where: { recruiterId: 'recruiter-123' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  });

  it('rejects applications to closed or missing jobs', async () => {
    prismaMock.job.findFirst.mockResolvedValue(null);

    await expect(service.apply('student-123', 'job-123')).rejects.toThrow(
      NotFoundException,
    );
    expect(prismaMock.jobApplication.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate applications', async () => {
    prismaMock.job.findFirst.mockResolvedValue(job);
    prismaMock.jobApplication.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(service.apply('student-123', 'job-123')).rejects.toThrow(
      ConflictException,
    );
  });

  it('lists candidates only for a recruiter-owned job', async () => {
    prismaMock.job.findFirst.mockResolvedValue(job);
    prismaMock.jobApplication.findMany.mockResolvedValue([]);

    await expect(
      service.listRecruiterApplications('recruiter-123', 'job-123'),
    ).resolves.toEqual([]);
    expect(prismaMock.jobApplication.findMany).toHaveBeenCalledWith({
      where: { jobId: 'job-123' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            education: true,
            skills: true,
          },
        },
      },
      orderBy: { appliedAt: 'asc' },
    });
  });

  it('updates an application status for the owning recruiter', async () => {
    prismaMock.job.findFirst.mockResolvedValue(job);
    prismaMock.jobApplication.findFirst.mockResolvedValue({
      id: 'application-123',
      jobId: 'job-123',
      status: 'APPLIED',
    });
    prismaMock.jobApplication.update.mockResolvedValue({
      id: 'application-123',
      status: 'SHORTLISTED',
    });

    await service.updateApplicationStatus(
      'recruiter-123',
      'job-123',
      'application-123',
      'SHORTLISTED',
    );

    expect(prismaMock.jobApplication.update).toHaveBeenCalledWith({
      where: { id: 'application-123' },
      data: { status: 'SHORTLISTED' },
      include: { job: true },
    });
  });

  it('does not change a terminal application', async () => {
    prismaMock.job.findFirst.mockResolvedValue(job);
    prismaMock.jobApplication.findFirst.mockResolvedValue({
      id: 'application-123',
      jobId: 'job-123',
      status: 'REJECTED',
    });

    await expect(
      service.updateApplicationStatus(
        'recruiter-123',
        'job-123',
        'application-123',
        'SHORTLISTED',
      ),
    ).rejects.toThrow(ConflictException);
    expect(prismaMock.jobApplication.update).not.toHaveBeenCalled();
  });
});