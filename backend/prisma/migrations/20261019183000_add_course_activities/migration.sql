-- CreateTable
CREATE TABLE "course_activities" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_activity_completions" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_activity_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_activities_courseId_position_key" ON "course_activities"("courseId", "position");
CREATE INDEX "course_activities_courseId_idx" ON "course_activities"("courseId");
CREATE UNIQUE INDEX "course_activity_completions_enrollmentId_activityId_key" ON "course_activity_completions"("enrollmentId", "activityId");

-- AddForeignKey
ALTER TABLE "course_activities" ADD CONSTRAINT "course_activities_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_activity_completions" ADD CONSTRAINT "course_activity_completions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_activity_completions" ADD CONSTRAINT "course_activity_completions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "course_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;