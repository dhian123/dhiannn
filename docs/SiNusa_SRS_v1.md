## SiNusa SRS v1.0 (Draft) – August 2025

### Overview
SiNusa is a mobile-first information system for Islamic boarding schools (pesantren) that unifies santri data, finance, administration, academics, and communications. This SRS translates the PRD into a buildable technical plan covering scope, architecture, security, data, APIs, and acceptance tests.

### In Scope (MVP)
- Pocket money wallet: balance, top-up, transaction history
- Bills & installments: list, create pay-intents, status tracking
- Attendance: view (santri/wali), input (admin)
- Report cards: PDF upload (admin), list and download (wali)
- Santri savings: balance + mutations
- Infaq donations
- Announcements
- Critiques & suggestions (feedback)
- Audit trail for financial and sensitive data changes
- Offline cache for key read models

### Out of Scope (Phase 2+)
- Full library circulation (advanced fines, inventory reports)
- Advanced CPS analytics, dashboarding
- Multi-tenant federation across many schools under one foundation

### Actors & Roles (RBAC)
- Santri: read own data (wallet, attendance, report cards, savings, announcements)
- Wali Santri: top-up, pay bills, view child data, send feedback
- Admin/Staff: CRUD santri, manage attendance, upload report cards, post announcements, moderate feedback
- Finance/Treasurer: manage bills, reconcile payments, run financial reports
- Super Admin/Foundation: user & role management, audit, global reports

Core permission domains: `wallet`, `bills`, `attendance`, `academics`, `savings`, `infaq`, `announcements`, `feedback`, `admin`, `audit`. Fine-grained actions: `read`, `create`, `update`, `delete`, `reconcile`, `upload`, `export`.

### Key Domain Concepts
- Double-entry ledger for monetary movements (wallet top-ups, bill payments, savings, infaq). Immutable journal with compensating entries for reversals.
- Payment intents with idempotency and async gateway webhooks. Server is source of truth; client never trusts redirect-only status.
- Report cards uploaded as files; access mediated via presigned URLs with time-limited access tokens.
- Offline-first reads for balance, bills, attendance, report card metadata, announcements.

### Non-Functional Targets
- Availability: 99%+; RPO ≤ 15 min; RTO ≤ 30 min
- Performance: p95 API < 500 ms; mobile first paint < 2 s on 4G
- Scale: ≥ 5,000 concurrent active users; ≥ 50 TPS burst on payment flows
- Security: OTP login, device binding, JWT, at-rest encryption for PII, RBAC enforcement, audit trail

### High-Level Architecture
- Mobile app (Flutter)
  - Local encrypted store (SQLite + secure storage) for offline cache
  - Background sync workers with metered/backoff policies
- API backend
  - REST (OpenAPI 3.0); stateless services with JWT auth
  - Services: Auth, Users/RBAC, Santri, Finance (Wallet/Ledger, Bills, Savings, Infaq), Academics (Attendance, Report Cards), Content (Announcements, Feedback), Files
  - Outbound integrations: Payment Gateway (e.g., Midtrans/Xendit), Object Storage (S3-compatible)
- Data
  - PostgreSQL (relational, strong consistency)
  - Redis (cache, queues, rate limiting, idempotency keys)
  - S3-compatible storage (report cards, attachments)
- Observability & Ops
  - OpenTelemetry traces/metrics/logs → Grafana/Prometheus + ELK
  - Feature flags & config via environment/secrets manager
  - CI/CD with zero-downtime deploys; blue/green for breaking migrations

### Proposed Tech Stack
- Mobile: Flutter (Dart), state mgmt Riverpod/Bloc, Drift/Hive for offline cache
- Backend: TypeScript + NestJS (or Go + Fiber), Zod/TypeBox for schema validation
- DB: Postgres 15+, Redis 7+
- Auth: JWT (RS256), OTP via SMS/WA provider, optional Keycloak for enterprise SSO
- Payments: Xendit or Midtrans with webhook signature verification
- File storage: MinIO/S3; presigned URLs

### Data Model (ERD – high level)
- User(id, phone, name, roleId, deviceBinding, …)
- Role(id, name) and RolePermission(roleId, permission)
- Santri(id, nis, name, waliId, classId, status, …); Wali(id, userId, relation)
- Wallet(accountId, ownerType, ownerId, balanceSnapshot)
- LedgerEntry(id, journalId, accountId, direction, amount, currency, refType, refId, occurredAt)
- Bill(id, santriId, title, amount, dueDate, status, installmentPlanId?)
- PaymentIntent(id, billId?, walletAccountId?, amount, status, pgRef, channel)
- SavingsAccount(id, santriId, balance)
- SavingsTransaction(id, savingsAccountId, type, amount, occurredAt)
- InfaqDonation(id, donorId?, amount, channel, status)
- AttendanceRecord(id, santriId, date, session, status, recordedBy)
- Course(id, name), Grade(id, santriId, courseId, score, term)
- ReportCard(id, santriId, term, fileKey, uploadedBy)
- Announcement(id, title, body, audience, publishedAt)
- Feedback(id, userId, type, message, createdAt, status)
- AuditLog(id, actorId, action, entity, entityId, before, after, at)

### API Surface (outline)
See `openapi/sinusa.yaml` for the initial contract. Key paths:
- Auth: `POST /auth/otp/request`, `POST /auth/otp/verify`
- Wallet: `GET /wallet`, `GET /wallet/transactions`, `POST /wallet/topups`
- Bills: `GET /bills`, `POST /bills/{billId}/pay-intents`
- Payments: `POST /payments/webhooks/{provider}` (no auth, signed)
- Attendance: `GET /attendance` (self/child), `POST /admin/attendance`
- Academics: `GET /report-cards`, `GET /report-cards/{id}/download`, `POST /admin/report-cards`
- Savings: `GET /savings`
- Infaq: `POST /infaq/donations`
- Content: `GET /announcements`, `POST /feedback`
- Admin: `POST /admin/santri`, `GET /audit/logs`

### Security & Privacy
- OTP + device binding (store hashed device fingerprint server-side)
- JWT (short-lived) + refresh tokens; rotate and revoke on device change
- RBAC checked server-side per endpoint and per resource
- PII encryption at rest (Postgres pgcrypto or app-level field encryption)
- Webhook HMAC signature validation; allow IP allowlist
- Rate limiting and abuse detection per phone/device/IP

### Offline-First
- Cache envelopes: wallet balance + last 50 transactions, last 60 days of bills/attendance, report card metadata, announcements
- Deterministic, idempotent sync endpoints with `updatedSince` cursors and ETags
- Conflict policy: server-wins for admin-authored data; client-queued writes use intent pattern with retries and backoff

### Payments & Idempotency
- Client sends `Idempotency-Key` for top-ups/pay-intents; server persists key → intent mapping in Redis/DB for TTL ≥ 24h
- Gateway redirect flow returns to app; final state derived from webhook-reconciled intent
- Ledger commit rules: only on terminal status; reversals via compensating entries

### Observability & Audit
- Structured logs with correlation IDs
- AuditLog recorded for: financial mutations; RBAC changes; PII updates; admin actions
- Metrics: request latency, error rates, payment success/timeout, sync queue depth

### MVP Acceptance Tests (samples)
- Top-up via PG updates wallet balance within ≤ 10 seconds after webhook
- Attendance history shows at least last 30 days; matches admin records
- Admin can upload a PDF report card; wali can list and download via presigned URL
- Audit logs exist for all financial transactions and RBAC changes
- If offline, last known bills/attendance/report card metadata remain accessible; sync resumes on reconnect

### Milestones
- M1: Auth + RBAC + core domain models (2–3 weeks)
- M2: Wallet + Payments + Ledger + Webhooks (3–4 weeks)
- M3: Bills + Attendance + Report Cards upload/download (3–4 weeks)
- M4: Savings + Infaq + Announcements + Feedback (2–3 weeks)
- M5: Offline sync + Observability + Hardening + UAT (3 weeks)

### Decisions Needed
- Payment provider (Xendit vs Midtrans)
- OTP provider (SMS/WhatsApp)
- Whether to use Keycloak vs custom JWT service

