import { IsArray, ArrayNotEmpty, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMentorProfileDto {
  @IsString()
  @IsNotEmpty()
  bio!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  expertise!: string[];

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  availability!: string;
}