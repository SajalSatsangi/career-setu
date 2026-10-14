
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('UsersController', () => {
  let controller: UsersController;

  const usersServiceMock = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  const authenticatedRequest = {
    user: {
      id: 'user-123',
      email: 'sajal@example.com',
      role: 'STUDENT',
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('getMyProfile', () => {
    it('returns the authenticated user profile', async () => {
      const profile = {
        id: 'user-123',
        name: 'Sajal Satsangi',
        email: 'sajal@example.com',
        role: 'STUDENT',
      };

      usersServiceMock.getProfile.mockResolvedValue(profile);

      await expect(
        controller.getMyProfile(authenticatedRequest as never),
      ).resolves.toEqual(profile);

      expect(usersServiceMock.getProfile).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateMyProfile', () => {
    it('forwards the authenticated user ID and update DTO', async () => {
      const dto = { name: 'Sajal Updated' };
      const updatedProfile = {
        id: 'user-123',
        name: 'Sajal Updated',
        email: 'sajal@example.com',
        role: 'STUDENT',
      };

      usersServiceMock.updateProfile.mockResolvedValue(updatedProfile);

      await expect(
        controller.updateMyProfile(authenticatedRequest as never, dto),
      ).resolves.toEqual(updatedProfile);

      expect(usersServiceMock.updateProfile).toHaveBeenCalledWith(
        'user-123',
        dto,
      );
    });
  });
});
