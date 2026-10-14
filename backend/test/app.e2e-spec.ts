import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CareerSetu API (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;

  type TestUser = {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role: 'STUDENT' | 'ADMIN';
    createdAt: Date;
    updatedAt: Date;
  };

  const users: TestUser[] = [];

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
              user[key as keyof TestUser],
            ]),
          );

          return Promise.resolve(selectedUser);
        },
      ),

      create: jest.fn(
        ({
          data,
        }: {
          data: {
            name: string;
            email: string;
            passwordHash: string;
            role: 'STUDENT' | 'ADMIN';
          };
        }) => {
          const now = new Date();

          const user: TestUser = {
            id: `test-user-${users.length + 1}`,
            ...data,
            createdAt: now,
            updatedAt: now,
          };

          users.push(user);

          return Promise.resolve(user);
        },
      ),

      update: jest.fn(
        ({
          where,
          data,
          select,
        }: {
          where: { id: string };
          data: { name?: string };
          select?: Record<string, boolean>;
        }) => {
          const user = users.find((item) => item.id === where.id);

          if (!user) {
            return Promise.reject(
              Object.assign(new Error('Record not found'), {
                code: 'P2025',
              }),
            );
          }

          if (data.name !== undefined) {
            user.name = data.name;
          }

          user.updatedAt = new Date();

          if (!select) {
            return Promise.resolve(user);
          }

          const selectedFields = Object.keys(select).filter(
            (key) => select[key],
          );

          const selectedUser = Object.fromEntries(
            selectedFields.map((key) => [
              key,
              user[key as keyof TestUser],
            ]),
          );

          return Promise.resolve(selectedUser);
        },
      ),
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

  // --------------------------------------------------
  // Authentication API
  // --------------------------------------------------

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

    it('rejects passwords without a letter', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: 'no-letter@example.com',
          password: '12345678',
        })
        .expect(400);
    });

    it('rejects passwords without a number', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: 'no-number@example.com',
          password: 'PasswordOnly',
        })
        .expect(400);
    });

    it('rejects passwords that exceed the maximum length', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: 'long-password@example.com',
          password: `Student1${'a'.repeat(121)}`,
        })
        .expect(400);
    });

    it('rejects registration names that exceed the maximum length', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'A'.repeat(101),
          email: 'long-name@example.com',
          password: 'Student123',
        })
        .expect(400);
    });

    it('rejects email addresses that exceed the maximum length', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test Student',
          email: `${'a'.repeat(246)}@example.com`,
          password: 'Student123',
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

    it('rejects malformed email addresses', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Student123',
        })
        .expect(400);
    });

    it('rejects empty passwords', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'student@example.com',
          password: '',
        })
        .expect(400);
    });

    it('rejects passwords that exceed the maximum length', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'student@example.com',
          password: 'A'.repeat(129),
        })
        .expect(400);
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

  // --------------------------------------------------
  // User Profile Management API
  // --------------------------------------------------

  describe('GET /users/me', () => {
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

    it('returns the authenticated user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: 'Test Student',
        email: 'student@example.com',
        role: 'STUDENT',
      });

      expect(response.body.passwordHash).toBeUndefined();
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .expect(401);
    });

    it('rejects an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', 'Bearer invalid.token.value')
        .expect(401);
    });
  });

  describe('PATCH /users/me', () => {
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

    it('updates the authenticated user name', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Student' })
        .expect(200);

      expect(response.body).toMatchObject({
        name: 'Updated Student',
        email: 'student@example.com',
        role: 'STUDENT',
      });

      expect(response.body.passwordHash).toBeUndefined();
    });

    it('trims surrounding whitespace from the updated name', async () => {
      const response = await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '  Updated Student  ' })
        .expect(200);

      expect(response.body.name).toBe('Updated Student');
    });

    it('persists the updated name for subsequent profile requests', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Updated Student' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.name).toBe('Updated Student');
    });

    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .send({ name: 'Updated Student' })
        .expect(401);
    });

    it('rejects an invalid token', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', 'Bearer invalid.token.value')
        .send({ name: 'Updated Student' })
        .expect(401);
    });

    it('rejects names that are too short', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'A' })
        .expect(400);
    });

    it('rejects blank names', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '   ' })
        .expect(400);
    });

    it('rejects names that exceed the maximum length', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'A'.repeat(101) })
        .expect(400);
    });

    it('rejects unexpected properties such as role', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Student',
          role: 'ADMIN',
        })
        .expect(400);
    });

    it('rejects an empty update', async () => {
      await request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });
  });
});
