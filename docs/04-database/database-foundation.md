# Database Foundation

## 1. Overview

करियरसेतु uses PostgreSQL as its primary relational database.

The backend uses Prisma ORM with the PostgreSQL driver adapter to provide type-safe database access from the NestJS application.

## 2. Technology

- Database: PostgreSQL 18
- ORM: Prisma 7.10.0
- PostgreSQL adapter: `@prisma/adapter-pg`
- PostgreSQL driver: `pg`
- Backend: NestJS
- Database client: Prisma Client

## 3. Local Development Database

Database name:

`career_setu`

Default local development connection:

```text
postgresql://postgres:<password>@localhost:5432/career_setu