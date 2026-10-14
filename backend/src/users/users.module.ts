import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  controllers: [UsersController, EducationController, SkillsController],
  providers: [UsersService, EducationService, SkillsService],
})
export class UsersModule {}
