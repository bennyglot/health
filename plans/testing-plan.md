# Testing Plan

## Strategy

| Layer | Type | Tool |
|---|---|---|
| Backend services | Unit + Integration | Jest (built-in with NestJS) |
| API contracts | E2E | Jest + Supertest |
| Frontend components | Unit | Vitest + React Testing Library |
| Frontend hooks/queries | Unit | Vitest + msw (mock service worker) |

---

## Backend — per service

### Unit tests

Test service logic in isolation. Mock Prisma + Redis.

**patient-service:**
```
patients.service.spec.ts
  ✓ findAll returns patients with requestCount from Redis
  ✓ findById throws NotFoundException when not found
  ✓ create persists patient and returns with requestCount=0
  ✓ update patches only provided fields
  ✓ delete removes patient and clears Redis key
```

**heart-rate-service:**
```
heart-rate.service.spec.ts
  ✓ create saves reading and publishes to Redis channel
  ✓ getHighEvents returns only readings >= 100 bpm
  ✓ getByPatient returns readings ordered by timestamp desc
```

**analytics-service:**
```
analytics.service.spec.ts
  ✓ getStats returns avg/max/min/count from DB
  ✓ getStats returns cached value on second call
  ✓ cache is invalidated on Redis heart-rate:new message
```

### Integration tests (E2E)

Spin up real NestJS app with test database (postgres test DB or SQLite).
Use `@nestjs/testing` + Supertest.

```
patients.e2e-spec.ts
  ✓ POST /patients → 201 + body
  ✓ GET  /patients → 200 + array
  ✓ GET  /patients/:id → 200 + patient
  ✓ GET  /patients/:id → 404 on missing
  ✓ PUT  /patients/:id → 200 + updated body
  ✓ DELETE /patients/:id → 204
  ✓ GET /health → { status: 'ok' }

heart-rate.e2e-spec.ts
  ✓ POST /heart-rate → 201
  ✓ GET  /heart-rate/:patientId → 200 + array
  ✓ GET  /heart-rate/high-events → 200 + only >= 100 bpm

analytics.e2e-spec.ts
  ✓ GET /analytics/:patientId → 200 + { avg, max, min, readingCount }
  ✓ GET /analytics/:patientId → 404 on no readings
```

### Request tracking middleware test

```
request-tracking.middleware.spec.ts
  ✓ increments Redis key on /:id route
  ✓ does NOT increment on / (list) route
  ✓ calls next() even if Redis fails
```

---

## Frontend — component tests

```
Dashboard.test.tsx
  ✓ renders patient list
  ✓ shows empty state when no patients
  ✓ opens Add Patient modal on button click
  ✓ calls createPatient on form submit

PatientDetail.test.tsx
  ✓ renders analytics stats (avg/max/min)
  ✓ renders heart rate chart with readings
  ✓ shows high events table
  ✓ navigates back to dashboard

PatientModal.test.tsx
  ✓ validates required fields
  ✓ pre-fills values in edit mode
  ✓ calls onSubmit with correct payload
```

---

## Test infrastructure

### Backend test DB

```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: medicaldb_test
    ports:
      - "5433:5432"
```

Each E2E suite: `beforeAll` runs `prisma db push`, `afterAll` drops tables.

### Environment

```
# .env.test
DATABASE_URL=postgresql://medical:secret@localhost:5433/medicaldb_test
REDIS_URL=redis://localhost:6379/1   # use DB index 1 to isolate from dev
```

### Scripts

```json
"test":     "jest",
"test:e2e": "jest --config jest-e2e.json",
"test:cov": "jest --coverage"
```

---

## Files to create

| File | Purpose |
|---|---|
| `patient-service/src/patients/patients.service.spec.ts` | unit |
| `patient-service/test/patients.e2e-spec.ts` | e2e |
| `patient-service/src/common/middleware/request-tracking.middleware.spec.ts` | unit |
| `heart-rate-service/src/heart-rate/heart-rate.service.spec.ts` | unit |
| `heart-rate-service/test/heart-rate.e2e-spec.ts` | e2e |
| `analytics-service/src/analytics/analytics.service.spec.ts` | unit |
| `analytics-service/test/analytics.e2e-spec.ts` | e2e |
| `frontend/src/pages/Dashboard.test.tsx` | component |
| `frontend/src/pages/PatientDetail.test.tsx` | component |
| `docker-compose.test.yml` | test DB |

---

## Coverage targets

| Service | Target |
|---|---|
| patient-service | 80% |
| heart-rate-service | 80% |
| analytics-service | 75% |
| frontend | 70% |
