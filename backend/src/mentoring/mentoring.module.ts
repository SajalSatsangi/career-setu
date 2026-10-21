import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MentoringController } from './mentoring.controller';
import { MentoringService } from './mentoring.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [MentoringController],
  providers: [MentoringService],
})
export class MentoringModule {}