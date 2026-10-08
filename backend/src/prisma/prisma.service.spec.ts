import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    await service.$connect();
  });

  afterAll(async () => {
    await service.$disconnect();
  });

  it('should connect to PostgreSQL', async () => {
    const result = await service.$queryRaw<
      Array<{ current_database: string }>
    >`SELECT current_database()`;

    expect(result[0]?.current_database).toBe('career_setu');
  });

  it('should create and read a user from PostgreSQL', async () => {
    const email = `prisma-test-${Date.now()}@example.com`;

    const user = await service.user.create({
      data: {
        name: 'Prisma Test User',
        email,
        passwordHash: 'test-password-hash',
      },
    });

    expect(user.email).toBe(email);
    expect(user.role).toBe('STUDENT');

    const foundUser = await service.user.findUnique({
      where: { email },
    });

    expect(foundUser).not.toBeNull();
    expect(foundUser?.name).toBe('Prisma Test User');

    await service.user.delete({
      where: { id: user.id },
    });
  });
});