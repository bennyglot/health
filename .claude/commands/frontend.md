# /frontend

Build the complete React + Vite frontend.

Read `plans/fullstack-plan.md` and `frontend/` scaffold before writing anything.

## Stack
- React 18 + TypeScript
- React Router v6
- @tanstack/react-query (data fetching + caching)
- Recharts (heart rate line chart)
- axios (HTTP client)
- Plain CSS modules (no UI library — keep it simple)

## Files to implement

### `src/api/client.ts`
Axios instance with `baseURL: /api`. All API calls go through here.

### `src/api/patients.ts`
```typescript
getPatients(): Promise<Patient[]>
getPatient(id: string): Promise<Patient>
createPatient(dto: CreatePatientDto): Promise<Patient>
```

### `src/api/heartRate.ts`
```typescript
getReadings(patientId: string): Promise<Reading[]>
getHighEvents(patientId?: string): Promise<HighEvent[]>
addReading(dto: CreateReadingDto): Promise<Reading>
```

### `src/api/analytics.ts`
```typescript
getAnalytics(patientId: string, startDate?: string, endDate?: string): Promise<Analytics>
```

### `src/types/index.ts`
TypeScript interfaces matching backend DTOs:
- `Patient { id, name, age, gender, requestCount, createdAt }`
- `Reading { id, patientId, heartRate, timestamp }`
- `HighEvent { patientId, heartRate, timestamp }`
- `Analytics { patientId, avg, max, min, readingCount }`

### `src/pages/Dashboard.tsx`
- Fetch all patients with `useQuery`
- Show patient cards in a grid
- Each card: name, age, gender, requestCount badge
- Click → navigate to `/patient/:id`
- Top banner: count of all high events (> 100 bpm) across all patients
- If no patients, show empty state

### `src/pages/PatientDetail.tsx`
Route: `/patient/:id`

Sections:
1. **Patient header** — name, age, gender, requestCount
2. **Heart Rate Chart** — Recharts LineChart of all readings (x: timestamp, y: heartRate)
   - Add reference line at y=100 (red dashed) to visually mark threshold
3. **Analytics panel** — two date inputs (startDate, endDate) + "Calculate" button
   - Shows avg / max / min cards
   - Fetches only on button click (not on every keystroke)
4. **High Events list** — table of readings > 100 bpm with timestamps
   - Sort by timestamp descending

### `src/components/HeartRateChart.tsx`
Props: `readings: Reading[]`
Recharts `<LineChart>` with:
- XAxis: formatted timestamp (HH:mm or date if multi-day)
- YAxis: domain [40, 160]
- ReferenceLine y={100} stroke="red" strokeDasharray="4 4"
- Tooltip showing exact bpm + timestamp
- Responsive container (100% width)

### `src/components/StatCard.tsx`
Props: `label: string, value: string | number, unit?: string`
Simple card for avg/max/min display.

### `src/components/HighEventsTable.tsx`
Props: `events: HighEvent[]`
Table with columns: Timestamp, Heart Rate (bpm). Highlight rows > 120 bpm in red.

## Rules
- All API calls use react-query — no manual useState+useEffect for fetching
- Loading states: show spinner or skeleton (simple div with opacity animation)
- Error states: show error message, not blank screen
- No UI library (MUI, Tailwind, etc.) — plain CSS modules only
- Dates displayed in local timezone (use `toLocaleString()`)
- `requestCount` shown as a badge: "12 requests"
- Back button on PatientDetail → Dashboard
