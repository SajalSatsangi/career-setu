import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should return a bcrypt hash different from the original password', async () => {
      const password = 'StrongPassword123!';

      const hash = await service.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toMatch(/^\$2[aby]\$/);
      await expect(bcrypt.compare(password, hash)).resolves.toBe(true);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'StrongPassword123!';

      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for the correct password', async () => {
      const password = 'StrongPassword123!';
      const hash = await service.hashPassword(password);

      await expect(
        service.verifyPassword(password, hash),
      ).resolves.toBe(true);
    });

    it('should return false for an incorrect password', async () => {
      const password = 'StrongPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await service.hashPassword(password);

      await expect(
        service.verifyPassword(wrongPassword, hash),
      ).resolves.toBe(false);
    });
  });
});