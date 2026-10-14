# Student Education and Skills API

## Overview

Manage the authenticated user's education history and skills.

- **Base path:** `/users/me`
- **Authentication:** JWT authentication is required for all endpoints.
- **Ownership:** The backend derives the user ID from the authenticated request.

## Education endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/me/education` | Create an education record |
| GET | `/users/me/education` | List education records |
| GET | `/users/me/education/:id` | Retrieve one record |
| PATCH | `/users/me/education/:id` | Update a record |
| DELETE | `/users/me/education/:id` | Delete a record |

### Create education

`POST /users/me/education`

Example request:

    {
      "degree": "B.Tech",
      "institution": "Example University",
      "fieldOfStudy": "Computer Science",
      "startYear": 2022,
      "endYear": 2026,
      "isCurrent": false
    }

| Field | Validation |
|---|---|
| `degree` | Required string |
| `institution` | Required string |
| `fieldOfStudy` | Required string |
| `startYear` | Required integer, 1950–2100 |
| `endYear` | Optional integer, 1950–2100 |
| `isCurrent` | Optional boolean; defaults to `false` |

The end year cannot precede the start year. Current education cannot have an end year.

The list endpoint orders records by start year descending. Updates accept optional education fields. Record IDs must be valid UUIDs.

## Skills endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/me/skills` | Add a skill |
| GET | `/users/me/skills` | List skills |
| GET | `/users/me/skills/:id` | Retrieve one skill |
| PATCH | `/users/me/skills/:id` | Update a skill |
| DELETE | `/users/me/skills/:id` | Delete a skill |

### Add a skill

`POST /users/me/skills`

Example request:

    {
      "name": "TypeScript",
      "proficiency": "INTERMEDIATE"
    }

| Field | Validation |
|---|---|
| `name` | Required string, trimmed, maximum 80 characters |
| `proficiency` | Optional enum: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`; defaults to `BEGINNER` |

Skill names must be unique per user. The list endpoint orders skills by name ascending. Updates accept optional `name` and `proficiency` fields. Record IDs must be valid UUIDs.

## Error responses

| Status | Meaning |
|---|---|
| 400 Bad Request | Invalid fields or education-year rules violated |
| 401 Unauthorized | Authentication missing or invalid |
| 404 Not Found | Record does not exist or is not owned by the user |
| 409 Conflict | Duplicate skill name |

Request validation rejects unknown fields. Response bodies follow the application's NestJS exception format.

## Data integrity and security

- Education and skills are linked to the authenticated user.
- Reads and mutations are scoped to the authenticated user's ID.
- Database relationships cascade when the owning user is deleted.
- The database enforces per-user skill-name uniqueness.
- Education-year consistency is checked in the service layer.

## Verification

Run the backend checks from the `backend` directory:

    npm test -- --runInBand
    npm run lint
    npm run build
    npx prisma migrate status
