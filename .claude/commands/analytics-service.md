# /analytics-service

Build the complete `analytics-service` NestJS implementation.

Read `plans/fullstack-plan.md` and `analytics-service/` scaffold before writing anything.

## Responsibilities
- Aggregate avg/max/min heart rate per patient within optional time range
- Cache results in Redis (TTL 300s)
- Subscribe to Redis pub/sub `heart-rate:new` → bust cache for that patient

## Files to implement

### `src/analytics/dto/analytics-query.dto.ts`
```typescript
@IsUUID() patientId (route param)
@IsOptional() @IsDateString() startDate
@IsOptional() @IsDateString() endDate
```

### `src/analytics/dto/analytics-response.dto.ts`
```typescript
{
  patientId: string
  avg: number        // rounded to 2 decimal places
  max: number
  min: number
  readingCount: number
  startDate?: string
  endDate?: string
}
```

### `src/analytics/analytics.repository.ts`
One method:
```typescript
aggregate(patientId: string, startDate?: Date, endDate?: Date): Promise<{
  avg: number, max: number, min: number, count: number
}>
```
Use Prisma `aggregate()` with `_avg`, `_max`, `_min`, `_count`.
Apply `timestamp` filter only when dates provided.
Throw `NotFoundException` if count === 0 (no readings found).

### `src/analytics/analytics.service.ts`
`getAnalytics(patientId, startDate?, endDate?)`:
1. Build cache key: `analytics:{patientId}:{startDate ?? 'all'}:{endDate ?? 'all'}`
2. Check Redis GET — return parsed JSON if hit
3. On miss: call repo.aggregate()
4. Redis SETEX result (JSON) TTL 300s
5. Return result

### `src/analytics/analytics.controller.ts`
```
GET  /analytics/:patientId?startDate=&endDate=  → getAnalytics()
```
Swagger decorators. Query params are optional.

### `src/redis/redis.service.ts`
Methods needed:
- `get(key): Promise<string | null>`
- `setex(key, ttl, value): Promise<void>`
- `del(pattern): Promise<void>` — used for cache bust (DEL exact keys)
- `subscribe(channel, handler): void` — subscribe to pub/sub channel

### `src/redis/redis.module.ts`
On module init, subscribe to `heart-rate:new`:
```typescript
// message = patientId
// DEL all keys matching analytics:{patientId}:*
// Since ioredis doesn't support pattern DEL natively,
// use SCAN + DEL loop or track keys in a Redis Set per patientId
```

**Key tracking approach**: When caching, also add key to Redis Set `analytics:keys:{patientId}`. On bust: SMEMBERS → DEL all members → DEL the set.

### `src/prisma/prisma.service.ts`
Same standard pattern. This service connects to the same Postgres DB, HeartRateReading table (read-only in practice).

## Rules
- avg rounded to 2 decimal places: `Math.round(raw * 100) / 100`
- Cache key is deterministic — same params always same key
- If no readings match query, return 404 not empty object
- Redis subscriber uses separate ioredis connection from command client (ioredis requirement)
- Pub/sub failure must not crash service — catch and log
- No HTTP calls to heart-rate-service — reads DB directly (documented architectural tradeoff)
