# Notifications API

Notifications require JWT authentication and are always scoped to the authenticated user.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/notifications` | List the latest 50 notifications |
| PATCH | `/notifications/:id/read` | Mark one owned notification as read |
| PATCH | `/notifications/read-all` | Mark all owned unread notifications as read |

The platform currently creates notifications for job applications, application status changes, mentorship requests, and mentorship decisions. Notification delivery is in-app; real-time delivery can be added after a queue or WebSocket transport is configured.