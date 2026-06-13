# /heart-rate-service

Build the complete `heart-rate-service` NestJS implementation.

Read `plans/fullstack-plan.md` and `heart-rate-service/` scaffold before writing anything.

## Responsibilities
- Heart rate readings CRUD
- High heart rate events query (> 100 bpm)
- Publish Redis event on new reading (triggers analytics cache bust)
- DB seed from `patients.json` heartRateReadings on boot

## Files to implement

### `src/heart-rate/dto/create-reading.dto.ts`
```typescript
@IsUUID() patientId
@IsInt() @Min(1) @Max(300) heartRate
@IsDateString() timestamp
```

### `src/heart-rate/dto/reading-response.dto.ts`
Fields: `id`, `patientId`, `heartRate`, `timestamp`.

### `src/heart-rate/dto/high-event-response.dto.ts`
Fields: `patientId`, `heartRate`, `timestamp`. For > 100 bpm results.

### `src/heart-rate/heart-rate.repository.ts`
Methods:
- `findByPatient(patientId: string): Promise<HeartRateReading[]>`
- `findHighEvents(patientId?: string): Promise<HeartRateReading[]>` — WHERE heartRate > 100, optional patientId filter
- `create(dto: CreateReadingDto): Promise<HeartRateReading>`

### `src/heart-rate/heart-rate.service.ts`
- `getByPatient(patientId)` → repo.findByPatient()
- `getHighEvents(patientId?)` → repo.findHighEvents()
- `addReading(dto)`:
  1. repo.create(dto)
  2. redis.publish(`heart-rate:new`, patientId)  ← triggers analytics cache bust
  3. return created reading

### `src/heart-rate/heart-rate.controller.ts`
```
GET  /heart-rate/:patientId           → getByPatient()
POST /heart-rate                      → addReading()
GET  /heart-rate/high-events          → getHighEvents() all patients
GET  /heart-rate/high-events/:patientId → getHighEvents(patientId)
```
Route order matters — `/high-events` must be registered BEFORE `/:patientId`.
Swagger decorators on all endpoints.

### `src/prisma/prisma.service.ts`
Same standard NestJS PrismaService pattern as patient-service.

### `src/redis/redis.service.ts`
Wraps ioredis. Methods needed here:
- `publish(channel: string, message: string): Promise<void>`

### `src/database/seed.ts`
On module init:
1. Count readings in DB
2. If 0, read `patients.json` heartRateReadings
3. Insert all via Prisma createMany
4. Log result

## Rules
- HIGH_HEART_RATE_THRESHOLD = 100 — define as constant, not magic number
- Redis publish is fire-and-forget — never throw if Redis down, only log
- `timestamp` stored as DateTime — accept ISO string in DTO, Prisma handles conversion
- No cross-service HTTP calls — service reads its own DB tables only
- Controller never touches Prisma or Redis directly
