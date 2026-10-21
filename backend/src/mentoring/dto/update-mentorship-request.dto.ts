import { IsEnum } from 'class-validator';
import { MentorshipRequestStatus } from '../../generated/prisma/client';

export class UpdateMentorshipRequestDto {
  @IsEnum(MentorshipRequestStatus)
  status!: MentorshipRequestStatus;
}