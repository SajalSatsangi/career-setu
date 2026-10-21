import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  listOpen() {
    return this.prisma.job.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
      include: { recruiter: { select: { id: true, name: true } } },
    });
  }

  create(recruiterId: string, dto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        recruiterId,
        companyName: dto.companyName,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        employmentType: dto.employmentType,
        requiredSkills: dto.requiredSkills,
      },
    });
  }

  listRecruiterJobs(recruiterId: string) {
    return this.prisma.job.findMany({
      where: { recruiterId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { applications: true } } },
    });
  }

  async close(recruiterId: string, jobId: string) {
    try {
      return await this.prisma.job.update({
        where: { id: jobId, recruiterId },
        data: { status: 'CLOSED' },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Job not found');
      }
      throw error;
    }
  }

  async apply(studentId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, status: 'OPEN' } });
    if (!job) throw new NotFoundException('Open job not found');

    try {
      const application = await this.prisma.jobApplication.create({
        data: { studentId, jobId },
        include: { job: true },
      });
      await this.notificationsService.create(
        job.recruiterId,
        'New job application',
        `A student applied for ${job.title} at ${job.companyName}.`,
        'JOB_APPLICATION',
      );
      return application;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already applied to this job');
      }
      throw error;
    }
  }

  async listRecruiterApplications(recruiterId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, recruiterId } });
    if (!job) throw new NotFoundException('Job not found');

    return this.prisma.jobApplication.findMany({
      where: { jobId },
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
  }

  async updateApplicationStatus(
    recruiterId: string,
    jobId: string,
    applicationId: string,
    status: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'HIRED',
  ) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, recruiterId } });
    if (!job) throw new NotFoundException('Job not found');

    const application = await this.prisma.jobApplication.findFirst({
      where: { id: applicationId, jobId },
    });
    if (!application) throw new NotFoundException('Application not found');

    if (application.status === 'HIRED' || application.status === 'REJECTED') {
      throw new ConflictException('This application is already closed');
    }

    const updatedApplication = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
      include: { job: true },
    });
    await this.notificationsService.create(
      application.studentId,
      'Application status updated',
      `Your application for ${job.title} is now ${status.toLowerCase()}.`,
      'APPLICATION_STATUS',
    );
    return updatedApplication;
  }

  listStudentApplications(studentId: string) {
    return this.prisma.jobApplication.findMany({
      where: { studentId },
      include: { job: true },
      orderBy: { appliedAt: 'desc' },
    });
  }
}