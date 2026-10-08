# करियरसेतु — System Architecture

## 1. Architecture Overview

करियरसेतु is initially designed as a modular monolith. The system uses a Next.js frontend, a NestJS backend API, Prisma ORM, and PostgreSQL.

The architecture is intentionally kept simple for the initial development stage while maintaining clear module boundaries so that individual components can evolve later.

### Initial technology stack

- Frontend: Next.js, React, TypeScript
- UI: Tailwind CSS
- Backend: NestJS, TypeScript
- API: REST
- ORM: Prisma
- Database: PostgreSQL
- Authentication: JWT
- Authorization: Role-Based Access Control (RBAC)
- Testing: Jest, React Testing Library, Playwright
- Version control: Git and GitHub

---

## 2. Architecture Style

The backend follows a modular monolith architecture.

This means:

- The backend is deployed as one application initially.
- Business functionality is separated into logical modules.
- Each module has clear responsibilities.
- Modules communicate through application-level services rather than direct database access from the frontend.
- The architecture can later be split into independent services if there is a clear scalability or operational reason.

The initial architecture avoids premature microservices complexity while keeping the codebase organized for future growth.

---

## 3. High-Level Architecture

```text
+---------------------------+
|        Users              |
|   Student / Admin         |
+-------------+-------------+
              |
              | HTTPS
              v
+---------------------------+
|     Next.js Frontend      |
|   React + TypeScript      |
+-------------+-------------+
              |
              | REST API
              v
+---------------------------+
|      NestJS Backend       |
|                           |
|  +---------------------+  |
|  | Authentication       |  |
|  | Users                |  |
|  | Profiles             |  |
|  | Skills               |  |
|  | Courses              |  |
|  | Lessons              |  |
|  | Enrollment           |  |
|  | Assessments          |  |
|  | Results              |  |
|  | Progress             |  |
|  | Administration       |  |
|  +---------------------+  |
+-------------+-------------+
              |
              | Prisma ORM
              v
+---------------------------+
|       PostgreSQL          |
|        Database           |
+---------------------------+
```

The frontend never connects directly to PostgreSQL. All application data access goes through the NestJS backend API.

---

## 4. Frontend Architecture

The frontend is built with Next.js, React, and TypeScript.

Its responsibilities include:

- Rendering pages and UI components.
- User registration and login interfaces.
- Student dashboard.
- Profile and skill management interfaces.
- Course and lesson interfaces.
- Assessment interfaces.
- Progress dashboards.
- Admin interfaces.
- Form handling and client-side validation.
- Communication with backend REST APIs.
- Handling authentication state.

The frontend should not contain core business rules that belong to the backend.

### Frontend flow

```text
User
  |
  v
Next.js Page
  |
  v
React Component
  |
  v
API Client
  |
  | HTTP/HTTPS
  v
NestJS REST API
```

---

## 5. Backend Architecture

The backend is built with NestJS and TypeScript.

Its responsibilities include:

- Exposing REST API endpoints.
- Authentication and authorization.
- Request validation.
- Business logic.
- Database operations.
- Error handling.
- Course and lesson management.
- Enrollment management.
- Assessment processing.
- Progress tracking.
- Administrative operations.

The backend follows a controller-service-data-access separation.

```text
HTTP Request
     |
     v
Controller
     |
     v
Service
     |
     v
Prisma
     |
     v
PostgreSQL
```

Controllers handle HTTP concerns, services contain business logic, and Prisma handles database interaction.

---

## 6. Backend Modules

The initial backend is divided into the following modules.

### Authentication

Responsible for:

- Registration
- Login
- Password handling
- JWT generation
- JWT validation
- Authentication guards
- Role-based authorization

### Users

Responsible for:

- User accounts
- User identity
- User status
- User roles

### Profiles

Responsible for:

- Student profile information
- Education information
- Experience information
- Career-related profile data

### Skills

Responsible for:

- Skill definitions
- User skills
- Skill proficiency
- Skill categorization

### Courses

Responsible for:

- Course creation
- Course metadata
- Course publishing
- Course management

### Lessons

Responsible for:

- Lessons within courses
- Lesson content
- Lesson ordering
- Lesson completion

### Enrollment

Responsible for:

- Course enrollment
- Enrollment status
- Student-course relationships

### Assessments

Responsible for:

- Assessments
- Questions
- Options
- Assessment configuration
- Assessment attempts

### Results

Responsible for:

- Assessment submissions
- Scores
- Results
- Performance records

### Progress

Responsible for:

- Course progress
- Lesson completion
- Learning statistics
- Student progress tracking

### Administration

Responsible for:

- Administrative operations
- User management
- Course management
- Platform-level controls

---

## 7. Database Architecture

PostgreSQL is the primary relational database.

Prisma is used as the ORM and database access layer.

Initial major entities include:

```text
User
Role
Profile
Skill
UserSkill
Course
Lesson
Enrollment
Assessment
Question
QuestionOption
Submission
Result
Progress
```

The exact database schema will be defined separately during database design.

### Database flow

```text
NestJS Service
      |
      v
Prisma ORM
      |
      v
PostgreSQL
```

The frontend does not have direct database access.

---

## 8. Authentication and Authorization

Authentication is handled using JWT-based authentication.

The initial roles are:

- STUDENT
- ADMIN

Future roles may include:

- MENTOR
- RECRUITER

The authorization model follows Role-Based Access Control (RBAC).

Example:

```text
Student
  -> View courses
  -> Enroll in courses
  -> Complete lessons
  -> Take assessments
  -> View progress
  -> Manage own profile

Admin
  -> Manage users
  -> Manage courses
  -> Manage lessons
  -> Manage assessments
  -> Access administrative operations
```

Authentication and authorization rules will be enforced by the backend rather than relying only on frontend restrictions.

---

## 9. Request and Data Flow

A typical request follows this flow:

```text
1. User interacts with Next.js UI
                |
                v
2. Frontend sends HTTP request
                |
                v
3. NestJS Controller receives request
                |
                v
4. Authentication / Authorization
                |
                v
5. Request validation
                |
                v
6. Service executes business logic
                |
                v
7. Prisma performs database operation
                |
                v
8. PostgreSQL returns data
                |
                v
9. Service processes result
                |
                v
10. Controller returns API response
                |
                v
11. Next.js updates the UI
```

---

## 10. Initial Deployment Architecture

The initial deployment can use a small number of independently deployable application components while keeping the backend itself as a modular monolith.

```text
             Internet
                 |
                 v
        +----------------+
        | Next.js App    |
        +-------+--------+
                |
                | HTTPS
                v
        +----------------+
        | NestJS API     |
        +-------+--------+
                |
                v
        +----------------+
        | PostgreSQL     |
        +----------------+
```

Docker, cloud infrastructure, CI/CD, monitoring, and other production infrastructure will be introduced progressively.

---

## 11. Future Architecture Components

The following components are intentionally not required for the first implementation.

### Redis

Potential uses:

- Caching
- Rate limiting
- Session-related workloads where appropriate
- Temporary data
- Background job coordination

### Background Workers

A worker system may later handle:

- Email notifications
- Resume processing
- AI processing
- Notifications
- Analytics jobs
- Long-running tasks

A queue such as BullMQ can be introduced when asynchronous processing becomes necessary.

### AI Service

AI capabilities may eventually be implemented as a separate Python/FastAPI service.

Potential responsibilities:

- Resume analysis
- Skill extraction
- Skill-gap analysis
- Personalized learning recommendations
- Career recommendations

The AI service should communicate with the main backend through defined APIs rather than allowing the frontend to access it directly.

### Object Storage

Object storage such as Amazon S3 may later be used for:

- Resume files
- Profile documents
- Course media
- Other user-uploaded files

### Search

A dedicated search system may be introduced if PostgreSQL search capabilities become insufficient for courses, skills, jobs, or other large datasets.

### Notifications

A notification subsystem may later support:

- Email
- In-app notifications
- Learning reminders
- Assessment notifications
- Career alerts

### Monitoring and Observability

Future production infrastructure should include:

- Application logs
- Error tracking
- Metrics
- Health checks
- Performance monitoring
- Alerting

---

## 12. Scalability Strategy

The system will scale incrementally.

### Initial stage

```text
Next.js
   |
NestJS Modular Monolith
   |
PostgreSQL
```

### Growth stage

```text
                 +----------------+
                 | Load Balancer  |
                 +-------+--------+
                         |
              +----------+----------+
              |                     |
        NestJS Instance       NestJS Instance
              |                     |
              +----------+----------+
                         |
                      Redis
                         |
                    PostgreSQL
```

Background workers and AI services can be added when workload requirements justify them.

The project will not adopt microservices solely for architectural appearance. Service separation should be driven by actual requirements such as independent scaling, deployment needs, workload isolation, or team ownership.

---

## 13. Architecture Evolution

The architecture is expected to evolve through stages.

### Phase 1 — Foundation

```text
Next.js
NestJS Modular Monolith
Prisma
PostgreSQL
JWT Authentication
```

### Phase 2 — Platform Growth

```text
Redis
Object Storage
Improved caching
Rate limiting
```

### Phase 3 — Asynchronous and AI Capabilities

```text
Background Workers
Job Queue
Python/FastAPI AI Service
Notifications
Search
```

### Phase 4 — Production Scaling

```text
Load Balancer
Multiple Backend Instances
Advanced Monitoring
Cloud Infrastructure
Infrastructure as Code
```

Microservices may be considered only when the system has a concrete requirement that justifies the added operational complexity.

---

## 14. Security Boundaries

The architecture follows these basic security principles:

- All external communication should use HTTPS in production.
- Passwords must never be stored in plaintext.
- Authentication is handled by the backend.
- Authorization is enforced server-side.
- Input validation is required for API requests.
- Database access is restricted to the backend.
- Sensitive configuration should be stored using environment variables or a secret-management system.
- API endpoints should follow least-privilege access rules.
- Security-sensitive operations should be logged appropriately.

Detailed security controls will be documented separately as the project develops.

---

## 15. Testing and Quality

Testing is part of the architecture and development process.

The project follows:

```text
Requirement
    |
    v
Design
    |
    v
Implementation
    |
    v
Automated Tests
    |
    v
Documentation
    |
    v
Code Review
    |
    v
CI Checks
    |
    v
Merge
```

Testing layers include:

- Unit tests for backend services and frontend logic.
- Integration tests for API and database interactions.
- Component tests for React components.
- End-to-end tests for important user workflows.

A feature is considered complete only after implementation, tests, documentation, review, and CI checks are completed.

---

## 16. Architecture Principles

The following principles guide the architecture:

1. Keep the initial system simple.
2. Use modular boundaries even within the monolith.
3. Keep business logic in backend services.
4. Prevent direct frontend-to-database access.
5. Enforce authorization on the backend.
6. Validate external input.
7. Test continuously during development.
8. Document important architectural decisions.
9. Avoid premature microservices and infrastructure complexity.
10. Introduce distributed components only when they provide a clear benefit.
11. Design for incremental scalability.
12. Keep future AI and background processing isolated behind clear interfaces.

---

## 17. Architecture Decision Summary

| Decision | Choice | Reason |
|---|---|---|
| Architecture style | Modular monolith | Simple to develop while preserving module boundaries |
| Frontend | Next.js + React + TypeScript | Modern full-stack React framework |
| Backend | NestJS + TypeScript | Structured backend architecture |
| API | REST | Simple and widely supported |
| Database | PostgreSQL | Reliable relational database |
| ORM | Prisma | Type-safe database access |
| Authentication | JWT | Suitable for API-based authentication |
| Authorization | RBAC | Clear role-based permissions |
| Initial roles | Student, Admin | Required for MVP |
| Cache | Future Redis | Avoid unnecessary infrastructure initially |
| Workers | Future BullMQ/workers | Introduce when asynchronous workloads require them |
| AI | Future Python/FastAPI service | Isolates AI-specific workloads |
| Object storage | Future | Add when file uploads require scalable storage |
| Microservices | Not initially | Avoid premature operational complexity |

---

## 18. Conclusion

करियरसेतु starts with a modular monolith consisting of a Next.js frontend, NestJS backend, Prisma ORM, and PostgreSQL database.

The architecture provides clear separation between presentation, API, business logic, and data access while leaving a controlled path for future Redis caching, background workers, AI services, object storage, search, notifications, monitoring, and cloud infrastructure.

The system will evolve based on actual requirements and workload rather than introducing complexity prematurely.
