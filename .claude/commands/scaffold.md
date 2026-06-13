# /scaffold

Create the full monorepo skeleton for the patient heart rate microservices project.

Read the plan at `plans/fullstack-plan.md` first.

## What to create

Create ALL folders and base config files (no implementation logic yet):

### Root
- `package.json` (workspaces: patient-service, heart-rate-service, analytics-service, frontend)
- `.gitignore` (node_modules, dist, .env, prisma migrations lock)
- `.env.example` with all required vars

### Each backend service: `patient-service/`, `heart-rate-service/`, `analytics-service/`
For each:
- `package.json` with NestJS deps: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/cache-manager`, `cache-manager-ioredis`, `prisma`, `@prisma/client`, `class-validator`, `class-transformer`, `ioredis`
- `tsconfig.json` (strict mode, decorators enabled)
- `tsconfig.build.json`
- `nest-cli.json`
- `prisma/schema.prisma` (see schema per service below)
- `src/main.ts` (bootstrap with Swagger + global ValidationPipe + global exception filter)
- `src/app.module.ts` (ConfigModule.forRoot, PrismaModule, service modules)
- `src/health/health.controller.ts` → GET /health returns `{ status: 'ok' }`
- `Dockerfile` (multi-stage: build → production, non-root user)
- `.env.example`

### Frontend: `frontend/`
- `package.json` (vite, react, react-router-dom, recharts, @tanstack/react-query, axios)
- `vite.config.ts` (proxy /api → nginx:80 in dev)
- `tsconfig.json`
- `index.html`
- `src/main.tsx`
- `src/App.tsx` (router setup)
- `Dockerfile` (multi-stage: build → nginx serve)
- `nginx.conf` (serve static, proxy /api to backend ingress)

### k8s/
- Create all empty yaml files listed in the plan (content filled by /k8s command)

### Prisma schemas

**patient-service:**
```prisma
model Patient {
  id        String   @id @default(uuid())
  name      String
  age       Int
  gender    String
  createdAt DateTime @default(now())
}
```

**heart-rate-service + analytics-service (same DB, same table):**
```prisma
model HeartRateReading {
  id        String   @id @default(uuid())
  patientId String
  heartRate Int
  timestamp DateTime
  @@index([patientId, timestamp])
}
```

## Rules
- No implementation logic in this pass — stubs and config only
- All env vars must come from `@nestjs/config`, never hardcoded
- Dockerfile must be multi-stage, production image non-root
- All `src/` files must be valid TypeScript that compiles (even if methods return TODO stubs)
