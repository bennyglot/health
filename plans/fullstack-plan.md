# Full Stack Assignment Plan — Patient Heart Rate Service (Microservices / k8s)

## Stack Decision

| Layer | Choice | Why |
|---|---|---|
| Backend | NestJS (TypeScript) × 3 services | Each service independent, deployable, scalable |
| DB | **PostgreSQL** (shared) | Relational, native aggregations, timestamp range queries |
| Cache | **Redis** (shared) | Atomic INCR for request tracking, TTL cache for analytics |
| Frontend | React + Vite | No SSR needed |
| ORM | Prisma | Type-safe, per-service schema subset |
| Charts | Recharts | Lightweight, React-native |
| Orchestration | Kubernetes | Deployments, Services, Ingress, HPA |
| Local dev | docker-compose | No minikube needed to demo |

**Shared DB tradeoff**: In strict DDD each service owns its schema. Here shared PostgreSQL is pragmatic — document this decision explicitly, shows you understand the tradeoff.

**No message broker** (Kafka/RabbitMQ): synchronous HTTP between services is sufficient at this scale. Adding a broker would be premature.

**No service mesh** (Istio): overkill for 3 services.

---

## Services Breakdown

| Service | Port | Owns |
|---|---|---|
| `patient-service` | 3001 | Patient CRUD + request tracking middleware |
| `heart-rate-service` | 3002 | Readings CRUD + high events query |
| `analytics-service` | 3003 | avg/max/min aggregations (Redis cached) |
| `frontend` | 5173 | React dashboard |

---

## Project Structure (Monorepo)

```
/
├── docker-compose.yml               ← local dev, single command
├── k8s/
│   ├── namespace.yaml
│   ├── configmap.yaml               ← DB_HOST, REDIS_HOST, service URLs
│   ├── secret.yaml                  ← DB_PASSWORD, REDIS_PASSWORD
│   ├── postgres/
│   │   ├── statefulset.yaml
│   │   ├── service.yaml
│   │   └── pvc.yaml
│   ├── redis/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── patient-service/
│   │   ├── deployment.yaml
│   │   └── service.yaml             ← ClusterIP
│   ├── heart-rate-service/
│   │   ├── deployment.yaml
│   │   └── service.yaml             ← ClusterIP
│   ├── analytics-service/
│   │   ├── deployment.yaml
│   │   ├── service.yaml             ← ClusterIP
│   │   └── hpa.yaml                 ← scale on CPU (analytics = heavy compute)
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   └── ingress.yaml                 ← nginx-ingress, routes all traffic
├── patients.json                    ← seed data
├── patient-service/
│   ├── Dockerfile
│   ├── prisma/schema.prisma         ← Patient model only
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/
│       ├── common/
│       │   ├── middleware/
│       │   │   └── request-tracking.middleware.ts  ← Redis INCR on GET /patients/:id
│       │   └── filters/http-exception.filter.ts
│       ├── patients/
│       │   ├── patients.module.ts
│       │   ├── patients.controller.ts
│       │   ├── patients.service.ts
│       │   └── dto/
│       └── database/
│           └── seed.ts              ← runs once on boot if DB empty
├── heart-rate-service/
│   ├── Dockerfile
│   ├── prisma/schema.prisma         ← HeartRateReading model only
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/
│       ├── heart-rate/
│       │   ├── heart-rate.module.ts
│       │   ├── heart-rate.controller.ts
│       │   ├── heart-rate.service.ts
│       │   └── dto/
│       └── common/
│           └── filters/http-exception.filter.ts
├── analytics-service/
│   ├── Dockerfile
│   ├── prisma/schema.prisma         ← HeartRateReading read-only view
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── config/
│       └── analytics/
│           ├── analytics.module.ts
│           ├── analytics.controller.ts
│           └── analytics.service.ts ← Redis cache + Postgres aggregation
└── frontend/
    ├── Dockerfile
    └── src/
        ├── pages/
        │   ├── Dashboard.tsx
        │   └── PatientDetail.tsx
        ├── components/
        │   ├── HeartRateChart.tsx
        │   ├── HighEventsBadge.tsx
        │   └── AnalyticsCard.tsx
        └── api/
            └── client.ts            ← all calls go through ingress, no direct service URLs
```

---

## k8s Ingress Routing

All external traffic enters via single Ingress (nginx-ingress):

```
/api/patients/*    → patient-service:3001
/api/heart-rate/*  → heart-rate-service:3002
/api/analytics/*   → analytics-service:3003
/*                 → frontend:5173
```

Frontend talks to `/api/*` — never hardcodes service IPs. Works identically in local docker-compose (nginx proxy) and k8s (Ingress).

---

## API Endpoints (unchanged, routing changes)

```
# patient-service
GET  /api/patients              → list all + requestCount from Redis
GET  /api/patients/:id          → single patient + requestCount
POST /api/patients              → create patient

# heart-rate-service
GET  /api/heart-rate/:patientId         → all readings
POST /api/heart-rate                    → add reading (also busts analytics cache)
GET  /api/heart-rate/high-events        → all readings > 100 bpm
GET  /api/heart-rate/high-events/:patientId

# analytics-service
GET  /api/analytics/:patientId?startDate=&endDate=  → { avg, max, min }

# each service
GET  /health                    → liveness/readiness probe target
```

Swagger at `/api/docs` per service (or aggregate via gateway — skip for now).

---

## Inter-Service Communication

```
frontend
  └─→ ingress
        ├─→ patient-service      (no upstream service calls)
        ├─→ heart-rate-service   (no upstream service calls)
        └─→ analytics-service    (queries Postgres directly for aggregation)
```

Services do NOT call each other — each reads Postgres directly for its own domain. This avoids circular deps and latency chains. Acceptable because DB is shared infrastructure.

**When heart-rate-service writes a new reading** → publishes Redis pub/sub event `heart-rate:new:{patientId}` → analytics-service subscriber busts that patient's cache keys. No message broker needed.

---

## Key Implementation Details

**Request Tracking** (patient-service only):
```
Redis INCR  patient:requests:{patientId}
```
Only patient-service middleware fires this. Heart-rate and analytics calls do NOT count — tracks "patient profile requests" specifically.

**Analytics Caching** (analytics-service):
- Cache key: `analytics:{patientId}:{startDate}:{endDate}`
- TTL: 300s
- Bust: Redis pub/sub listener → DEL matching keys on new reading

**Prisma Schema** (shared DB, each service uses subset):
```prisma
# patient-service/prisma/schema.prisma
model Patient {
  id        String   @id @default(uuid())
  name      String
  age       Int
  gender    String
  createdAt DateTime @default(now())
}

# heart-rate-service/prisma/schema.prisma + analytics-service
model HeartRateReading {
  id        String   @id @default(uuid())
  patientId String
  heartRate Int
  timestamp DateTime
  @@index([patientId, timestamp])   ← critical for range queries
}
```

**Seed** — patient-service runs on boot, idempotent check, loads `patients.json`.

---

## k8s Resource Summary

```
Namespace: medical

StatefulSets:   postgres
Deployments:    redis, patient-service, heart-rate-service, analytics-service, frontend
Services:       all above (ClusterIP) + frontend (LoadBalancer or Ingress)
Ingress:        nginx routing rules
ConfigMap:      DB_HOST, REDIS_HOST, PATIENT_SERVICE_URL, etc.
Secret:         DB_PASSWORD, REDIS_PASSWORD
PVC:            postgres-data (10Gi)
HPA:            analytics-service (min:1, max:5, CPU>70%)
```

**Liveness probe**: `GET /health` → 200  
**Readiness probe**: `GET /health` + DB ping  
**Resource limits**: set on all containers (shows k8s awareness)

---

## Local Dev (docker-compose)

```yaml
services:
  postgres:          image: postgres:16-alpine
  redis:             image: redis:7-alpine
  patient-service:   build: ./patient-service    ports: 3001
  heart-rate-service: build: ./heart-rate-service ports: 3002
  analytics-service: build: ./analytics-service  ports: 3003
  frontend:          build: ./frontend            ports: 5173
  nginx:             image: nginx:alpine          ports: 80   ← mimics ingress routing
```

`docker compose up` → full stack, same routing as k8s.

---

## Frontend Views (unchanged)

**Dashboard** (`/`)
- Patient cards with request count badge
- High heart rate alert banner

**Patient Detail** (`/patient/:id`)
- Recharts line chart of readings
- Analytics panel with date range picker
- High events list with timestamps

---

## What Makes This Impressive

1. **Microservices split** by bounded context, not arbitrary — each service owns clear domain
2. **Shared DB with documented tradeoff** — shows maturity, not dogma
3. **Redis pub/sub cache bust** on write — no stale analytics, no polling
4. **k8s HPA** on analytics-service — the right service to scale (CPU-heavy aggregations)
5. **Ingress-first frontend** — no service URLs in frontend code, works in any env
6. **Liveness + readiness probes** on every service
7. **Idempotent seed** — safe to restart pods without duplicate data
8. **docker-compose mirrors k8s** — local dev parity, no surprises in cluster

---

## What to Skip (Keep Simple)

- No auth/JWT — not asked
- No service mesh (Istio) — 3 services don't need it
- No message broker — Redis pub/sub handles the one async need
- No per-service DB — shared PostgreSQL, document tradeoff
- No test suite — 2-3hr limit
- No minikube/kind setup — docker-compose demo is sufficient
