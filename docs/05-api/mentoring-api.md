# Mentoring API

Mentoring endpoints require JWT authentication. Mentor profile creation and request review are protected by the server-side `MENTOR` role.

## Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/mentoring/mentors` | Authenticated | List public mentor profiles |
| POST | `/mentoring/profile` | Mentor | Create the authenticated mentor's profile |
| GET | `/mentoring/me/requests` | Authenticated | List the current student's requests |
| POST | `/mentoring/mentors/:mentorId/requests` | Authenticated | Request mentorship from a mentor |
| GET | `/mentoring/mentor/requests` | Mentor | List requests received by the mentor |
| PATCH | `/mentoring/mentor/requests/:id/status` | Mentor owner | Accept or decline a request |

Requests are unique per student and mentor. A request starts as `PENDING`; mentor decisions may be `ACCEPTED` or `DECLINED`. Resolved requests cannot be changed. Public mentor listings expose only the mentor's public profile and display name.

## Verification

Apply the mentoring migration, then run from `backend`:

    npx prisma migrate deploy
    npx prisma generate
    npm run lint
    npm run build
    npm test -- --runInBand