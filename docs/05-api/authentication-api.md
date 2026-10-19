# Authentication API

## 1. Overview

करियरसेतु uses JWT-based authentication for its NestJS REST API. Users can register as students, log in, and retrieve their profile using a bearer access token.

**Base URL:** `http://localhost:3000`

## 2. Configuration

Configure these variables in the backend's local `.env` file:

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection | Local database URL |
| `JWT_SECRET` | Secret used to sign and verify JWTs | Generate a strong random secret |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |

The default token lifetime is 15 minutes. Never commit the actual JWT secret or other credentials. Keep `.env.example` limited to placeholders.

## 3. Endpoints

### 3.1 Register a student

**POST `/auth/register`**

Authentication: Not required.

Request:

```json
{
  "name": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "StrongPass123"
}
```

Validation:
- Name must be a string containing 2–100 characters.
- Email must be valid and contain no more than 255 characters.
- Password must be 8–128 characters and contain at least one letter and one number.
- Unexpected properties are rejected.
- Email is trimmed and normalized to lowercase.
- New registrations receive the `STUDENT` role.

Successful response: HTTP `201 Created`.

```json
{
  "accessToken": "<jwt-access-token>",
  "user": {
    "id": "<user-id>",
    "name": "Aarav Sharma",
    "email": "aarav@example.com",
    "role": "STUDENT",
    "createdAt": "<timestamp>",
    "updatedAt": "<timestamp>"
  }
}
```

Possible errors:
- `400 Bad Request`: Invalid input.
- `409 Conflict`: Email is already registered.

### 3.2 Log in

**POST `/auth/login`**

Authentication: Not required.

Request:

```json
{
  "email": "aarav@example.com",
  "password": "StrongPass123"
}
```

Successful response: HTTP `201 Created`, containing an access token and the current user profile.

Possible errors:
- `400 Bad Request`: Invalid input.
- `401 Unauthorized`: Invalid email or password.

Email addresses are trimmed and normalized to lowercase. Unknown email addresses and incorrect passwords receive the same authentication error message.

### 3.3 Retrieve the current user

**GET `/auth/me`**

Authentication: Required.

Header:

```text
Authorization: Bearer <jwt-access-token>
```

Successful response: HTTP `200 OK`, containing the user's ID, name, email, role, creation timestamp, and update timestamp.

The password hash is excluded from the returned profile.

Possible errors:
- `401 Unauthorized`: Missing, invalid, or expired token, or a user that no longer exists.

### 3.4 Log out

**POST `/auth/logout`**

Authentication: Not currently required.

Successful response: HTTP `201 Created`.

```json
{
  "message": "Logout successful. Discard the access token on the client."
}
```

This is a stateless logout operation. The server does not revoke an issued JWT, so a token remains usable until it expires. The client must discard the token. Server-side revocation or refresh-token rotation can be introduced in a future authentication enhancement.

### 3.5 Request a password reset

**POST `/auth/forgot-password`**

Authentication: Not required.

Request:

```json
{
  "email": "aarav@example.com"
}
```

The endpoint returns the same generic message whether or not the email exists. For local development only, the response also includes `developmentToken`; production responses never include the raw token. The intended production delivery integration is email or another trusted notification provider.

Reset tokens are stored only as SHA-256 hashes, expire after 15 minutes, and invalidate previous tokens for the same user.

### 3.6 Reset the password

**POST `/auth/reset-password`**

Authentication: Not required.

Request:

```json
{
  "token": "<reset-token>",
  "password": "NewStrongPass123"
}
```

The token is single-use. Invalid, expired, or already-used tokens return `401 Unauthorized`. A successful reset hashes the new password and marks the token as used in one transaction.

## 4. Security considerations

- Passwords are hashed using bcrypt with a work factor of 12 before storage.
- Password hashes are never returned by the authentication API.
- JWTs contain the user ID (`sub`), email, and role.
- Protected routes extract bearer tokens from the `Authorization` header.
- Token expiration is enforced during JWT validation.
- Global request validation rejects unexpected fields.
- Recruiter and administrator operations use the role guard and role decorator for server-side authorization.
- Production deployments must use a strong secret supplied through secure environment configuration and HTTPS.

## 5. Testing

Authentication is covered by unit and end-to-end (E2E) tests for registration, login, JWT authentication, and request validation.

The E2E tests cover:

- Successful registration and duplicate-email rejection.
- Registration validation for passwords without a letter, passwords without a number, passwords exceeding 128 characters, names exceeding 100 characters, and emails exceeding 255 characters.
- Login validation for malformed email addresses, empty passwords, and passwords exceeding 128 characters.
- Successful login and rejection of invalid credentials.
- Current-user retrieval with missing, invalid, and expired tokens.
- Rejection of unexpected request properties.

The backend unit suite is verified locally; database-backed integration testing still requires applying migrations and running PostgreSQL.

Run the backend checks from the `backend` directory:

```powershell
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run lint
npm run build
```
