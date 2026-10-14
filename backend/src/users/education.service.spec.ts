import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { EducationService } from './education.service';

describe('EducationService', () => {
  let service: EducationService;

  const prismaMock = {
    education: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const existing = {
    id: 'education-123',
    userId: 'user-123',
    degree: 'B.Tech',
    institution: 'Example University',
    fieldOfStudy: 'Computer Science',
    startYear: 2022,
    endYear: 2026,
    isCurrent: false,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(EducationService);
  });

  it('creates education for the authenticated user', async () => {
    prismaMock.education.create.mockResolvedValue(existing);

    await expect(
      service.create('user-123', {
        degree: 'B.Tech',
        institution: 'Example University',
        fieldOfStudy: 'Computer Science',
        startYear: 2022,
        endYear: 2026,
      }),
    ).resolves.toEqual(existing);

    expect(prismaMock.education.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        degree: 'B.Tech',
        institution: 'Example University',
        fieldOfStudy: 'Computer Science',
        startYear: 2022,
        endYear: 2026,
        isCurrent: false,
      },
    });
  });

  it('rejects an end year before the start year', async () => {
    await expect(
      service.create('user-123', {
        degree: 'B.Tech',
        institution: 'Example University',
        fieldOfStudy: 'Computer Science',
        startYear: 2025,
        endYear: 2023,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.education.create).not.toHaveBeenCalled();
  });

  it('rejects an end year for current education', async () => {
    await expect(
      service.create('user-123', {
        degree: 'B.Tech',
        institution: 'Example University',
        fieldOfStudy: 'Computer Science',
        startYear: 2025,
        endYear: 2026,
        isCurrent: true,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('lists only the authenticated user’s records', async () => {
    prismaMock.education.findMany.mockResolvedValue([existing]);

    await expect(service.list('user-123')).resolves.toEqual([existing]);

    expect(prismaMock.education.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
      orderBy: { startYear: 'desc' },
    });
  });

  it('does not return another user’s education record', async () => {
    prismaMock.education.findFirst.mockResolvedValue(null);

    await expect(service.get('user-123', 'education-456')).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaMock.education.findFirst).toHaveBeenCalledWith({
      where: { id: 'education-456', userId: 'user-123' },
    });
  });

  it('updates only a record belonging to the authenticated user', async () => {
    prismaMock.education.findFirst.mockResolvedValue(existing);
    prismaMock.education.update.mockResolvedValue({
      ...existing,
      degree: 'M.Tech',
    });

    await service.update('user-123', 'education-123', {
      degree: 'M.Tech',
    });

    expect(prismaMock.education.update).toHaveBeenCalledWith({
      where: { id: 'education-123', userId: 'user-123' },
      data: { degree: 'M.Tech' },
    });
  });

  it('deletes only a record belonging to the authenticated user', async () => {
    prismaMock.education.delete.mockResolvedValue(existing);

    await expect(service.remove('user-123', 'education-123')).resolves.toEqual(
      existing,
    );

    expect(prismaMock.education.delete).toHaveBeenCalledWith({
      where: { id: 'education-123', userId: 'user-123' },
    });
  });
});
