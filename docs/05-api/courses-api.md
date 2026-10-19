# Courses and Enrollment API

The course catalog is available to authenticated users under `/courses`.

## Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/courses` | Authenticated | List published courses |
| GET | `/courses/me/enrollments` | Authenticated | List the current student's enrollments |
| POST | `/courses/:id/enroll` | Authenticated | Enroll the current student in a published course |
| GET | `/courses/:id/activities` | Authenticated | List ordered activities for a course |
| POST | `/courses/:courseId/activities/:activityId/complete` | Authenticated | Complete an activity for the current student's enrollment |
| POST | `/courses` | Administrator | Create a course; unpublished by default unless `published` is supplied |
| PATCH | `/courses/:id/publish` | Administrator | Publish a course |
| POST | `/courses/:id/activities` | Administrator | Add an ordered activity to a course |

## Course fields

Course creation accepts `title`, `description`, `category`, and `level`. The title is limited to 160 characters, category to 80 characters, and level to 30 characters. A course is visible in the catalog only after publication.

Enrollment is unique per student and course. Duplicate enrollment returns `409 Conflict`. Enrollment starts with `progress: 0`. Activities are ordered by their `position`; completing an activity is scoped to the authenticated student's enrollment and recalculates progress as the percentage of completed activities. Duplicate completion returns `409 Conflict`.

## Verification

Apply the migration and regenerate Prisma from the `backend` directory:

    npx prisma migrate deploy
    npx prisma generate
    npm run lint
    npm run build
    npm test -- --runInBand