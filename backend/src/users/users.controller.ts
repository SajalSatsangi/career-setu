
import {
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
  Body,
} from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.usersService.getProfile(request.user.id);
  }

  @Patch('me')
  updateMyProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(request.user.id, dto);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listAllUsers() {
    return this.usersService.listAllUsers();
  }

  @Patch('admin/:id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateUserRole(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(request.user.id, id, dto.role);
  }
}
