import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UserRole } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseActivityDto } from './dto/create-course-activity.dto';
import { CoursesService } from './courses.service';

interface AuthenticatedRequest extends Request {
  user: { id: string };
}

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  list() {
    return this.coursesService.list();
  }

  @Get('me/enrollments')
  listMyEnrollments(@Req() request: AuthenticatedRequest) {
    return this.coursesService.listMyEnrollments(request.user.id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  listAll() {
    return this.coursesService.list(false);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Patch(':id/publish')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.publish(id);
  }

  @Post(':id/enroll')
  enroll(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.enroll(request.user.id, id);
  }

  @Get(':id/activities')
  listActivities(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.listActivities(id);
  }

  @Post(':id/activities')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  createActivity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCourseActivityDto,
  ) {
    return this.coursesService.createActivity(id, dto);
  }

  @Post(':courseId/activities/:activityId/complete')
  completeActivity(
    @Req() request: AuthenticatedRequest,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('activityId', ParseUUIDPipe) activityId: string,
  ) {
    return this.coursesService.completeActivity(request.user.id, courseId, activityId);
  }
}