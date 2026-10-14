import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SkillsService } from './skills.service';
import { Prisma } from '../generated/prisma/client';

describe('SkillsService', () => {
  let service: SkillsService;

  const prismaMock = {
    userSkill: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const existing = {
    id: 'skill-123',
    userId: 'user-123',
    name: 'TypeScript',
    proficiency: 'INTERMEDIATE',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(SkillsService);
  });

  it('creates a skill with default BEGINNER proficiency', async () => {
    prismaMock.userSkill.create.mockResolvedValue(existing);

    await expect(
      service.create('user-123', { name: 'TypeScript' }),
    ).resolves.toEqual(existing);

    expect(prismaMock.userSkill.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        name: 'TypeScript',
        proficiency: 'BEGINNER',
      },
    });
  });

  it('lists only the authenticated user’s skills', async () => {
    prismaMock.userSkill.findMany.mockResolvedValue([existing]);

    await expect(service.list('user-123')).resolves.toEqual([existing]);

    expect(prismaMock.userSkill.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { name: 'asc' },
    });
  });

  it('does not return another user’s skill', async () => {
    prismaMock.userSkill.findFirst.mockResolvedValue(null);

    await expect(service.get('user-123', 'skill-456')).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.userSkill.findFirst).toHaveBeenCalledWith({
      where: { id: 'skill-456', userId: 'user-123' },
    });
  });

  it('updates only a skill belonging to the authenticated user', async () => {
    prismaMock.userSkill.findFirst.mockResolvedValue(existing);
    prismaMock.userSkill.update.mockResolvedValue({
      ...existing,
      proficiency: 'ADVANCED',
    });

    await service.update('user-123', 'skill-123', {
      proficiency: 'ADVANCED',
    });

    expect(prismaMock.userSkill.update).toHaveBeenCalledWith({
      where: { id: 'skill-123', userId: 'user-123' },
      data: { proficiency: 'ADVANCED' },
    });
  });

  it('deletes only a skill belonging to the authenticated user', async () => {
    prismaMock.userSkill.delete.mockResolvedValue(existing);

    await expect(service.remove('user-123', 'skill-123')).resolves.toEqual(
      existing,
    );

    expect(prismaMock.userSkill.delete).toHaveBeenCalledWith({
      where: { id: 'skill-123', userId: 'user-123' },
    });
  });

  it('rejects creating a duplicate skill', async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: 'test',
      },
    );

    prismaMock.userSkill.create.mockRejectedValue(duplicateError);

    await expect(
      service.create('user-123', { name: 'TypeScript' }),
    ).rejects.toThrow(ConflictException);
  });
});
