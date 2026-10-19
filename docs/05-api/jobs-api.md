# Jobs and Applications API

Jobs require JWT authentication. Recruiter-only mutations are protected by the server-side role guard; student applications are scoped to the authenticated user.

## Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/jobs` | Authenticated | List open jobs |
| POST | `/jobs` | Recruiter | Create a job owned by the recruiter |
| PATCH | `/jobs/:id/close` | Recruiter owner | Close one of the recruiter's jobs |
| POST | `/jobs/:id/apply` | Authenticated | Apply to an open job |
| GET | `/jobs/me/applications` | Authenticated | List the current student's applications |
| GET | `/jobs/mine` | Recruiter | List the recruiter's jobs and application counts |
| GET | `/jobs/:id/applications` | Recruiter owner | Review candidates for one owned job |
| PATCH | `/jobs/:jobId/applications/:applicationId/status` | Recruiter owner | Shortlist, reject, or hire a candidate |

## Job fields

Creation requires company name, title, description, location, employment type, and at least one required skill. New jobs are open by default. Applications are unique per student and job; duplicate applications return `409 Conflict`.

Application statuses begin at `APPLIED` and support `SHORTLISTED`, `REJECTED`, and `HIRED`. Recruiters can only review applications attached to their own jobs. Rejected and hired applications are terminal and cannot be changed.

## Verification

After applying the jobs migration, run from `backend`:

    npx prisma migrate deploy
    npx prisma generate
    npm run lint
    npm run build
    npm test -- --runInBand