import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../generated/prisma/client';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const jwtMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          AuthService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
          {
            provide: JwtService,
            useValue: jwtMock,
          },
        ],
      }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'StrongPassword123!';

      const hash =
        await service.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$/);

      await expect(
        bcrypt.compare(password, hash),
      ).resolves.toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'StrongPassword123!';

      const hash1 =
        await service.hashPassword(password);

      const hash2 =
        await service.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for the correct password', async () => {
      const password = 'StrongPassword123!';

      const hash =
        await service.hashPassword(password);

      await expect(
        service.verifyPassword(password, hash),
      ).resolves.toBe(true);
    });

    it('should return false for an incorrect password', async () => {
      const password = 'StrongPassword123!';
      const wrongPassword = 'WrongPassword123!';

      const hash =
        await service.hashPassword(password);

      await expect(
        service.verifyPassword(
          wrongPassword,
          hash,
        ),
      ).resolves.toBe(false);
    });
  });

  describe('register', () => {
    it('should create a student and return an access token', async () => {
      const createdUser = {
        id: 'user-1',
        name: 'Sajal',
        email: 'sajal@example.com',
        passwordHash: 'hashed-password',
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returnedUser = {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      };

      // First call:
      // Check whether the email already exists.
      //
      // Second call:
      // getCurrentUser() after creating the user.
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(returnedUser);

      prismaMock.user.create.mockResolvedValue(
        createdUser,
      );

      jwtMock.signAsync.mockResolvedValue(
        'test-access-token',
      );

      const result = await service.register({
        name: ' Sajal ',
        email: ' SAJAL@EXAMPLE.COM ',
        password: 'StrongPassword123!',
      });

      expect(
        prismaMock.user.findUnique,
      ).toHaveBeenNthCalledWith(1, {
        where: {
          email: 'sajal@example.com',
        },
      });

      expect(
        prismaMock.user.create,
      ).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Sajal',
          email: 'sajal@example.com',
          role: UserRole.STUDENT,
          passwordHash: expect.any(String),
        }),
      });

      expect(
        prismaMock.user.findUnique,
      ).toHaveBeenNthCalledWith(2, {
        where: {
          id: 'user-1',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'sajal@example.com',
        role: UserRole.STUDENT,
      });

      expect(result.accessToken).toBe(
        'test-access-token',
      );

      expect(result.user).toEqual(returnedUser);
    });

    it('should reject an existing email', async () => {
      const existingUser = {
        id: 'existing-user',
        name: 'Existing User',
        email: 'sajal@example.com',
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(
        existingUser,
      );

      await expect(
        service.register({
          name: 'Sajal',
          email: 'sajal@example.com',
          password: 'StrongPassword123!',
        }),
      ).rejects.toThrow(
        'Email is already registered',
      );

      expect(
        prismaMock.user.create,
      ).not.toHaveBeenCalled();

      expect(
        jwtMock.signAsync,
      ).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const password = 'StrongPassword123!';

      const passwordHash =
        await service.hashPassword(password);

      const user = {
        id: 'user-1',
        name: 'Sajal',
        email: 'sajal@example.com',
        passwordHash,
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const returnedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      // First call:
      // Find user for authentication.
      //
      // Second call:
      // getCurrentUser() after successful login.
      prismaMock.user.findUnique
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(returnedUser);

      jwtMock.signAsync.mockResolvedValue(
        'test-access-token',
      );

      const result = await service.login({
        email: ' SAJAL@EXAMPLE.COM ',
        password,
      });

      expect(
        prismaMock.user.findUnique,
      ).toHaveBeenNthCalledWith(1, {
        where: {
          email: 'sajal@example.com',
        },
      });

      expect(jwtMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'sajal@example.com',
        role: UserRole.STUDENT,
      });

      expect(result.accessToken).toBe(
        'test-access-token',
      );

      expect(result.user).toEqual(returnedUser);
    });

    it('should reject an unknown email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'StrongPassword123!',
        }),
      ).rejects.toThrow(
        'Invalid email or password',
      );

      expect(
        jwtMock.signAsync,
      ).not.toHaveBeenCalled();
    });

    it('should reject an incorrect password', async () => {
      const passwordHash =
        await service.hashPassword(
          'CorrectPassword123!',
        );

      const user = {
        id: 'user-1',
        name: 'Sajal',
        email: 'sajal@example.com',
        passwordHash,
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.findUnique.mockResolvedValue(
        user,
      );

      await expect(
        service.login({
          email: 'sajal@example.com',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(
        'Invalid email or password',
      );

      expect(
        jwtMock.signAsync,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user without the password hash', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        name: 'Sajal',
        email: 'sajal@example.com',
        role: UserRole.STUDENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result =
        await service.getCurrentUser('user-1');

      expect(
        prismaMock.user.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'user-1',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      expect(result).not.toHaveProperty(
        'passwordHash',
      );

      expect(result.email).toBe(
        'sajal@example.com',
      );
    });

    it('should reject when the user no longer exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue(
        null,
      );

      await expect(
        service.getCurrentUser('missing-user'),
      ).rejects.toThrow(
        'User no longer exists',
      );
    });
  });
});