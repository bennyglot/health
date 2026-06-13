# Real-Time Data Simulator Plan

## Goal

Simulate continuous heart rate readings after seed data loads.
Base state = seed patients + readings. From there: generate realistic mock readings automatically.

---

## Architecture

```
SimulatorService (cron, heart-rate-service)
  └─► HeartRateService.create()  (internal call, reuses existing logic)
        └─► postgres INSERT HeartRateReading
        └─► Redis PUBLISH heart-rate:new  {patientId}
              └─► analytics-service subscriber busts cache keys
                    └─► frontend refetchInterval picks up fresh data
```

No new service. No WebSocket. Existing pub/sub handles cache invalidation.

---

## Backend — SimulatorService (heart-rate-service)

### Dependencies to add

```json
"@nestjs/schedule": "^3.0.0"
```

### Module changes

- `AppModule` imports `ScheduleModule.forRoot()`
- `HeartRateModule` provides `SimulatorService`

### SimulatorService logic

```
@Cron('*/10 * * * * *')  // every 10 seconds
generateReadings():
  for each SEED_PATIENT_ID:
    baseRate = getBaseRate(patientId)     // Alice=72, Bob=95 (from seed)
    variation = random(-15, +15)
    spike = random(0,1) < 0.10            // 10% chance
    heartRate = spike ? random(130,160) : clamp(baseRate + variation, 45, 125)
    timestamp = now()
    await heartRateService.create({ patientId, heartRate, timestamp })
```

### Patient IDs

Hardcode the 2 seed patient IDs from `patients.json` as env vars or constants.
No HTTP call to patient-service (avoids circular dep + latency).

```
SIMULATOR_PATIENT_IDS=a1b2c3d4-e5f6-7890-abcd-ef1234567890,b2c3d4e5-f6a7-8901-bcde-f12345678901
```

### Base rates per patient

| Patient | Base BPM | Profile |
|---|---|---|
| Alice Johnson (45F) | 72 | Normal resting |
| Bob Smith (62M) | 95 | Slightly elevated |

### Spike behavior

- 10% of ticks → spike (130–160 bpm)
- Guarantees high-event table stays active
- Mirrors real cardiac monitoring scenarios

---

## Frontend — Live Updates

### React Query refetchInterval

Add to all active queries on PatientDetail and Dashboard:

```typescript
{ refetchInterval: 10_000 }   // poll every 10s
```

Queries to make live:
- `GET /api/patients` — requestCount ticks up as simulator hits patient data
- `GET /api/heart-rate/:patientId` — new readings appear on chart
- `GET /api/heart-rate/high-events` — spikes surface here
- `GET /api/analytics/:patientId` — avg/max/min recalculate

### Live badge

Add pulsing "● LIVE" indicator in UI header when refetchInterval is active.

### Chart windowing

Show last **20 readings** on the time-series chart (not all-time).
Prevents chart from becoming unreadable as data grows.

---

## Data volume estimate

- 2 patients × 1 reading/10s = **12 readings/minute**
- After 1 hour: ~720 rows — negligible for postgres
- Analytics cache TTL=300s auto-expires; pub/sub busts it sooner on each write

---

## Files to create / modify

| File | Change |
|---|---|
| `heart-rate-service/package.json` | add `@nestjs/schedule` |
| `heart-rate-service/src/app.module.ts` | import `ScheduleModule.forRoot()` |
| `heart-rate-service/src/simulator/simulator.service.ts` | new — cron job |
| `heart-rate-service/src/heart-rate/heart-rate.module.ts` | provide SimulatorService |
| `docker-compose.yml` | add `SIMULATOR_PATIENT_IDS` env var to heart-rate-service |
| `frontend/src/pages/Dashboard.tsx` | add `refetchInterval`, Live badge |
| `frontend/src/pages/PatientDetail.tsx` | add `refetchInterval`, chart windowing |

---

## Out of scope

- WebSocket / SSE (polling sufficient for demo)
- Dynamic patient list from DB (hardcoded IDs keep it simple)
- Configurable tick rate (10s hardcoded, good for live demo)
