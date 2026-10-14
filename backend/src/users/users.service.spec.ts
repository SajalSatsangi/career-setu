
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  const existingUser = {
    id: 'user-123',
    name: 'Sajal Satsangi',
    email: 'sajal@example.com',
    role: 'STUDENT',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('getProfile', () => {
    it('returns the profile with only safe fields', async () => {
      prismaMock.user.findUnique.mockResolvedValue(existingUser);

      const result = await service.getProfile('user-123');

      expect(result).toEqual(existingUser);
      expect(result).not.toHaveProperty('passwordHash');
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        } satisfies Prisma.UserSelect,
      });
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('missing-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('updates the name and returns only safe profile fields', async () => {
      const updatedUser = {
        ...existingUser,
        name: 'Sajal Updated',
        updatedAt: new Date('2026-01-03T00:00:00.000Z'),
      };

      const dto: UpdateProfileDto = { name: 'Sajal Updated' };
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile('user-123', dto);

      expect(result).toEqual(updatedUser);
      expect(result).not.toHaveProperty('passwordHash');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { name: 'Sajal Updated' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        } satisfies Prisma.UserSelect,
      });
    });

    it('rejects an update when no editable field is provided', async () => {
      await expect(
        service.updateProfile('user-123', {}),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the user disappears during an update', async () => {
      prismaMock.user.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.updateProfile('missing-user', { name: 'Updated Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('uses the authenticated user ID for the update', async () => {
      prismaMock.user.update.mockResolvedValue(existingUser);

      await service.updateProfile('user-456', { name: 'Another Name' });

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-456' },
        }),
      );
    });
  });
});
