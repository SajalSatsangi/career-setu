import { Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

interface AuthenticatedRequest extends Request { user: { id: string }; }

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) { return this.notificationsService.list(request.user.id); }

  @Patch(':id/read')
  markRead(@Req() request: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markRead(request.user.id, id);
  }

  @Patch('read-all')
  markAllRead(@Req() request: AuthenticatedRequest) { return this.notificationsService.markAllRead(request.user.id); }
}