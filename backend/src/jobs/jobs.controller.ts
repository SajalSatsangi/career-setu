import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { JobsService } from './jobs.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  listOpen() {
    return this.jobsService.listOpen();
  }

  @Get('me/applications')
  listStudentApplications(@Req() request: AuthenticatedRequest) {
    return this.jobsService.listStudentApplications(request.user.id);
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER)
  listRecruiterJobs(@Req() request: AuthenticatedRequest) {
    return this.jobsService.listRecruiterJobs(request.user.id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER)
  create(@Req() request: AuthenticatedRequest, @Body() dto: CreateJobDto) {
    return this.jobsService.create(request.user.id, dto);
  }

  @Patch(':id/close')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER)
  close(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.close(request.user.id, id);
  }

  @Post(':id/apply')
  apply(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.apply(request.user.id, id);
  }

  @Get(':id/applications')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER)
  listRecruiterApplications(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.jobsService.listRecruiterApplications(request.user.id, id);
  }

  @Patch(':jobId/applications/:applicationId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RECRUITER)
  updateApplicationStatus(
    @Req() request: AuthenticatedRequest,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.jobsService.updateApplicationStatus(
      request.user.id,
      jobId,
      applicationId,
      dto.status,
    );
  }
}