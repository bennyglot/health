# /patient-service

Build the complete `patient-service` NestJS implementation.

Read `plans/fullstack-plan.md` and `patient-service/` scaffold before writing anything.

## Responsibilities
- Patient CRUD
- Request tracking middleware (Redis INCR)
- DB seed from `patients.json` on boot

## Files to implement

### `src/patients/dto/create-patient.dto.ts`
```typescript
@IsString() name
@IsInt() @Min(0) age
@IsString() gender
```

### `src/patients/dto/patient-response.dto.ts`
Include `requestCount: number` field pulled from Redis.

### `src/patients/entities/patient.entity.ts`
Map Prisma Patient model.

### `src/patients/patients.repository.ts`
Thin wrapper around PrismaService. Methods:
- `findAll(): Promise<Patient[]>`
- `findById(id: string): Promise<Patient | null>`
- `create(dto: CreatePatientDto): Promise<Patient>`

### `src/patients/patients.service.ts`
- `findAll()` → repo.findAll() + attach requestCount from Redis for each
- `findById(id)` → repo.findById() + requestCount, throw NotFoundException if null
- `create(dto)` → repo.create()
- `getRequestCount(patientId)` → Redis GET `patient:requests:{patientId}` (return 0 if null)

### `src/patients/patients.controller.ts`
```
GET  /patients        → findAll()
GET  /patients/:id    → findById()
POST /patients        → create()
```
Swagger decorators on every endpoint and DTO.

### `src/common/middleware/request-tracking.middleware.ts`
NestJS middleware that runs on `GET /patients/:id`.
```
Redis INCR  patient:requests:{id from params}
```
Attach to PatientsModule consumer for route `/patients/:id`.

### `src/prisma/prisma.service.ts`
Standard NestJS PrismaService (extends PrismaClient, onModuleInit connects, onModuleDestroy disconnects).

### `src/prisma/prisma.module.ts`
Global module exporting PrismaService.

### `src/redis/redis.service.ts`
Wraps ioredis. Methods:
- `incr(key: string): Promise<number>`
- `get(key: string): Promise<string | null>`
- `publish(channel: string, message: string): Promise<void>`

### `src/redis/redis.module.ts`
Global module. Creates ioredis client from `REDIS_URL` config.

### `src/database/seed.ts`
On module init:
1. Count patients in DB
2. If 0, read `patients.json` from project root
3. Insert all patients via Prisma createMany
4. Log seed result

## Rules
- All Redis keys: `patient:requests:{patientId}`
- NotFoundException message: `Patient {id} not found`
- requestCount always returns number (0 if key missing in Redis)
- Middleware must not throw — fire-and-forget Redis INCR, log error if Redis unavailable
- No business logic in controller — delegate to service
- No direct Prisma calls in service — use repository
