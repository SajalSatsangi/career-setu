-- CreateEnum
CREATE TYPE "MentorshipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MENTOR';

-- CreateTable
CREATE TABLE "mentor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "expertise" TEXT[] NOT NULL,
    "availability" VARCHAR(160) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mentorship_requests" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "status" "MentorshipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mentorship_requests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mentor_profiles_userId_key" ON "mentor_profiles"("userId");
CREATE UNIQUE INDEX "mentorship_requests_studentId_mentorId_key" ON "mentorship_requests"("studentId", "mentorId");
CREATE INDEX "mentorship_requests_mentorId_status_idx" ON "mentorship_requests"("mentorId", "status");

ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mentorship_requests" ADD CONSTRAINT "mentorship_requests_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;