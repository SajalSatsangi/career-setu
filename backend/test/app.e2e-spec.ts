import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  const users: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'STUDENT' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  const prismaMock = {
    user: {
      findUnique: jest.fn(
        ({
          where,
          select,
        }: {
          where: { id?: string; email?: string };
          select?: Record<string, boolean>;
        }) => {
          const user = users.find(
            (item) =>
              (where.id !== undefined && item.id === where.id) ||
              (where.email !== undefined && item.email === where.email),
          );

          if (!user) {
            return Promise.resolve(null);
          }

          if (!select) {
            return Promise.resolve(user);
          }

          const selectedFields = Object.keys(select).filter(
            (key) => select[key],
          );

          const selectedUser = Object.fromEntries(
            selectedFields.map((key) => [
              key,
              user[key as keyof typeof user],
            ]),
          );

          return Promise.resolve(selectedUser);
        },
      ),

      create: jest.fn(({ data }: { data: { name: string; email: string; passwordHash: string; role: 'STUDENT' | 'ADMIN' } }) => {
        const now = new Date();
        const user = {
          id: `test-user-${users.length + 1}`,
          ...data,
          createdAt: now,
          updatedAt: now,
        };

        users.push(user);
        return Promise.resolve(user);
      }),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    jwtService = app.get(JwtService);
  });

  beforeEach(() => {
    users.length = 0;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('registers a student and returns an access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@example.com',
          password: 'Student123',
        })
        .expect(201);

      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.user).toMatchObject({
        name: 'Test Student',
        email: 'student@example.com',
        role: 'STUDENT',
      });
      expect(response.body.user.passwordHash).toBeUndefined();

      expect(
        await jwtService.verifyAsync(response.body.accessToken),
      ).toMatchObject({
        sub: response.body.user.id,
        email: 'student@example.com',
        role: 'STUDENT',
      });
    });

    it('normalizes email addresses', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: '  STUDENT@EXAMPLE.COM  ',
          password: 'Student123',
        })
        .expect(201);

      expect(response.body.user.email).toBe('student@example.com');
    });

    it('rejects duplicate email addresses', async () => {
      const payload = {
        name: 'Test Student',
        email: 'student@example.com',
        password: 'Student123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(payload)
        .expect(409);
    });

    it('rejects invalid registration data', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'A',
          email: 'not-an-email',
          password: 'short',
        })
        .expect(400);
    });

    it('rejects unexpected properties', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@example.com',
          password: 'Student123',
          role: 'ADMIN',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@example.com',
          password: 'Student123',
        })
        .expect(201);
    });

    it('logs in with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'STUDENT@example.com',
          password: 'Student123',
        })
        .expect(201);

      expect(response.body.accessToken).toEqual(expect.any(String));
      expect(response.body.user.email).toBe('student@example.com');
    });

    it('rejects an incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'student@example.com',
          password: 'WrongPassword123',
        })
        .expect(401);
    });

    it('rejects an unknown email', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'Student123',
        })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: 'student@example.com',
          password: 'Student123',
        })
        .expect(201);

      accessToken = response.body.accessToken;
    });

    it('returns the current user with a valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'Test Student',
        email: 'student@example.com',
        role: 'STUDENT',
      });
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('rejects a missing token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('rejects an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.value')
        .expect(401);
    });

    it('rejects an expired token', async () => {
      const expiredToken = await jwtService.signAsync(
        {
          sub: 'test-user',
          email: 'expired@example.com',
          role: 'STUDENT',
        },
        { expiresIn: -1 },
      );

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});
