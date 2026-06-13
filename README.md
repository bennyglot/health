# Patient Heart Rate Service

Full-stack microservices system for managing patients and heart rate readings.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript) × 3 services |
| Database | PostgreSQL 16 |
| Cache / Tracking | Redis 7 |
| ORM | Prisma |
| Frontend | React 18 + Vite |
| Charts | Recharts |
| Orchestration | Kubernetes (nginx-ingress) |
| Local Dev | Docker Compose + nginx |

## Services

| Service | Port | Responsibility |
|---|---|---|
| `patient-service` | 3001 | Patient CRUD + request tracking |
| `heart-rate-service` | 3002 | Readings CRUD + high event queries |
| `analytics-service` | 3003 | avg/max/min aggregations (Redis cached) |
| `frontend` | 80 | React dashboard |

## Quick Start (Local)

```bash
# 1. Copy env files
cp .env.example .env
cp patient-service/.env.example patient-service/.env
cp heart-rate-service/.env.example heart-rate-service/.env
cp analytics-service/.env.example analytics-service/.env

# 2. Start everything
docker compose up --build

# 3. Open
open http://localhost:8080
```

Seed data from `patients.json` loads automatically on first boot.

## API

All routes proxied through nginx on port `8080` (local) or ingress (k8s).

### Patients — `patient-service`
```
GET  /api/patients              List all patients (includes requestCount)
GET  /api/patients/:id          Single patient
POST /api/patients              Create patient
```

### Heart Rate — `heart-rate-service`
```
GET  /api/heart-rate/:patientId         All readings for patient
POST /api/heart-rate                    Add reading
GET  /api/heart-rate/high-events        All readings > 100 bpm
GET  /api/heart-rate/high-events/:id    Filtered by patient
```

### Analytics — `analytics-service`
```
GET  /api/analytics/:patientId?startDate=&endDate=    avg / max / min
```

### Health
```
GET  /health    (available on each service directly)
```

Swagger docs available at `http://localhost:{port}/api` per service.

## Architecture

```
Client
  └─→ nginx (port 8080 local / Ingress in k8s)
        ├─→ /api/patients/*    → patient-service:3000
        ├─→ /api/heart-rate/*  → heart-rate-service:3000
        ├─→ /api/analytics/*   → analytics-service:3000
        └─→ /*                 → frontend:80
```

Services do not call each other — each reads PostgreSQL directly for its own domain tables. This avoids circular dependencies and latency chains. Trade-off vs strict per-service DB ownership is documented below.

**Request tracking**: `patient-service` middleware fires `Redis INCR patient:requests:{patientId}` on every `GET /patients/:id`. Atomic — no race conditions.

**Analytics caching**: Results cached in Redis with key `analytics:{patientId}:{start}:{end}`, TTL 300s. When `heart-rate-service` writes a new reading it publishes `heart-rate:new` on Redis pub/sub. `analytics-service` subscriber busts all cached keys for that patient.

## Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/ -R

# Check rollout
kubectl rollout status deployment/patient-service -n medical
kubectl rollout status deployment/heart-rate-service -n medical
kubectl rollout status deployment/analytics-service -n medical

# Port-forward for local testing against cluster
kubectl port-forward svc/patient-service 3001:3000 -n medical
```

Ingress expects host `medical.local` — add to `/etc/hosts`:
```
127.0.0.1  medical.local
```

`analytics-service` has HPA configured (min 1, max 5 pods, CPU > 70%) — aggregation queries are CPU-heavy.

## Design Decisions

**Shared PostgreSQL vs per-service DB**: Services share one PostgreSQL instance and each owns its tables. In a production system with strict bounded context isolation, each service would own its schema on a separate instance. Shared DB was chosen here to reduce operational complexity without compromising the domain separation at the code level.

**Redis pub/sub over message broker**: The only async communication needed is cache invalidation on write. Redis pub/sub handles this without introducing Kafka or RabbitMQ. If requirements grew to include audit logging, event replay, or fan-out to many consumers, a proper message broker would be the right next step.

**No service mesh**: Three services communicating via ClusterIP DNS do not justify Istio overhead. mTLS, circuit breaking, and distributed tracing can be layered in later.

## Project Structure

```
/
├── docker-compose.yml
├── nginx/nginx.conf               # local dev ingress proxy
├── k8s/                           # kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── postgres/
│   ├── redis/
│   ├── patient-service/
│   ├── heart-rate-service/
│   ├── analytics-service/
│   ├── frontend/
│   └── ingress.yaml
├── patient-service/
├── heart-rate-service/
├── analytics-service/
├── frontend/
└── patients.json                  # seed data
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (with password) |
| `PORT` | Service port (default: 3000) |
| `NODE_ENV` | `development` or `production` |

Copy `.env.example` files — never commit `.env` files.
