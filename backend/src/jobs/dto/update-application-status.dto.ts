import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../../generated/prisma/client';

export class UpdateApplicationStatusDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;
}