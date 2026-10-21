import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const prismaMock = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();
    service = module.get(NotificationsService);
  });

  it('lists only the authenticated user notifications', async () => {
    prismaMock.notification.findMany.mockResolvedValue([]);

    await expect(service.list('user-1')).resolves.toEqual([]);
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('marks only an owned notification as read', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });

    await expect(service.markRead('user-1', 'notification-1')).resolves.toEqual({
      message: 'Notification marked as read',
    });
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notification-1', userId: 'user-1' },
      data: { readAt: expect.any(Date) },
    });
  });

  it('rejects marking another user notification as read', async () => {
    prismaMock.notification.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.markRead('user-1', 'notification-1')).rejects.toThrow(NotFoundException);
  });
});