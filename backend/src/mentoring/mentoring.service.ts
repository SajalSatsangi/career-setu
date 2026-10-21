import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMentorProfileDto } from './dto/create-mentor-profile.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MentoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  listMentors() {
    return this.prisma.mentorProfile.findMany({
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProfile(userId: string, dto: CreateMentorProfileDto) {
    try {
      return await this.prisma.mentorProfile.create({
        data: {
          userId,
          bio: dto.bio,
          expertise: dto.expertise,
          availability: dto.availability,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Mentor profile already exists');
      }
      throw error;
    }
  }

  async requestMentorship(studentId: string, mentorId: string) {
    const mentor = await this.prisma.mentorProfile.findUnique({ where: { userId: mentorId } });
    if (!mentor) throw new NotFoundException('Mentor not found');

    try {
      const request = await this.prisma.mentorshipRequest.create({
        data: { studentId, mentorId },
        include: { mentor: { select: { id: true, name: true } } },
      });
      await this.notificationsService.create(
        mentorId,
        'New mentorship request',
        'A student would like your career guidance.',
        'MENTORSHIP_REQUEST',
      );
      return request;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A mentorship request already exists');
      }
      throw error;
    }
  }

  listStudentRequests(studentId: string) {
    return this.prisma.mentorshipRequest.findMany({
      where: { studentId },
      include: { mentor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listMentorRequests(mentorId: string) {
    return this.prisma.mentorshipRequest.findMany({
      where: { mentorId },
      include: { student: { select: { id: true, name: true, email: true, skills: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateRequestStatus(mentorId: string, requestId: string, status: 'PENDING' | 'ACCEPTED' | 'DECLINED') {
    const request = await this.prisma.mentorshipRequest.findFirst({ where: { id: requestId, mentorId } });
    if (!request) throw new NotFoundException('Mentorship request not found');
    if (request.status !== 'PENDING') throw new ConflictException('This mentorship request is already resolved');

    const updatedRequest = await this.prisma.mentorshipRequest.update({ where: { id: requestId }, data: { status }, include: { student: { select: { id: true, name: true } } } });
    await this.notificationsService.create(
      request.studentId,
      'Mentorship request updated',
      `Your mentorship request was ${status.toLowerCase()}.`,
      'MENTORSHIP_STATUS',
    );
    return updatedRequest;
  }
}