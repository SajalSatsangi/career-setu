import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateMentorProfileDto } from './dto/create-mentor-profile.dto';
import { UpdateMentorshipRequestDto } from './dto/update-mentorship-request.dto';
import { MentoringService } from './mentoring.service';

interface AuthenticatedRequest extends Request { user: { id: string }; }

@Controller('mentoring')
@UseGuards(JwtAuthGuard)
export class MentoringController {
  constructor(private readonly mentoringService: MentoringService) {}

  @Get('mentors')
  listMentors() { return this.mentoringService.listMentors(); }

  @Post('profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MENTOR)
  createProfile(@Req() request: AuthenticatedRequest, @Body() dto: CreateMentorProfileDto) {
    return this.mentoringService.createProfile(request.user.id, dto);
  }

  @Get('me/requests')
  listStudentRequests(@Req() request: AuthenticatedRequest) {
    return this.mentoringService.listStudentRequests(request.user.id);
  }

  @Post('mentors/:mentorId/requests')
  requestMentorship(@Req() request: AuthenticatedRequest, @Param('mentorId', ParseUUIDPipe) mentorId: string) {
    return this.mentoringService.requestMentorship(request.user.id, mentorId);
  }

  @Get('mentor/requests')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MENTOR)
  listMentorRequests(@Req() request: AuthenticatedRequest) {
    return this.mentoringService.listMentorRequests(request.user.id);
  }

  @Patch('mentor/requests/:id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.MENTOR)
  updateRequestStatus(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMentorshipRequestDto) {
    return this.mentoringService.updateRequestStatus(request.user.id, id, dto.status);
  }
}