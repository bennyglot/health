# Patient CRUD Management Plan

## Goal

Full create / read / update / delete for patients — backend API + frontend UI.

---

## Current State

| Operation | Backend | Frontend |
|---|---|---|
| Create | `POST /patients` ✓ | ✗ |
| Read all | `GET /patients` ✓ | ✓ (Dashboard list) |
| Read one | `GET /patients/:id` ✓ | ✓ (PatientDetail) |
| Update | ✗ | ✗ |
| Delete | ✗ | ✗ |

---

## Backend — patient-service

### New endpoints

| Method | Path | Action |
|---|---|---|
| `PUT` | `/patients/:id` | Update name / age / gender |
| `DELETE` | `/patients/:id` | Delete patient + cascade cleanup |

### Update DTO

```typescript
class UpdatePatientDto {
  name?:   string   // optional fields — partial update
  age?:    number
  gender?: string
}
```

Validation: same rules as CreatePatientDto (class-validator).

### Delete cascade

When patient deleted:
1. `DELETE FROM "Patient" WHERE id = :id`
2. Publish Redis event `patient:deleted` → heart-rate-service + analytics-service can react
3. Clear Redis key `patient:requests:{id}`

**Note:** HeartRateReadings for deleted patient remain in DB (soft reference, no FK).
Document this tradeoff — in production add FK constraint or tombstone pattern.

### Repository changes

```typescript
update(id: string, dto: UpdatePatientDto): Promise<Patient>
delete(id: string): Promise<void>
```

### Controller changes

```typescript
@Put(':id')    updatePatient(@Param('id') id, @Body() dto: UpdatePatientDto)
@Delete(':id') deletePatient(@Param('id') id)
```

---

## Frontend — UI

### Dashboard page

- **"Add Patient" button** → opens modal/form
- Each patient row: **Edit** icon + **Delete** icon

### Add Patient modal

Fields: Name, Age, Gender (Male/Female/Other select)
On submit: `POST /api/patients` → refetch list

### Edit Patient modal

Pre-filled with current values.
On submit: `PUT /api/patients/:id` → refetch list + detail

### Delete confirmation

Inline confirm dialog: "Delete Alice Johnson? This cannot be undone."
On confirm: `DELETE /api/patients/:id` → redirect to Dashboard if on that patient's detail page

### React Query mutations

```typescript
const createMutation  = useMutation({ mutationFn: createPatient,  onSuccess: () => queryClient.invalidateQueries(['patients']) })
const updateMutation  = useMutation({ mutationFn: updatePatient,  onSuccess: () => queryClient.invalidateQueries(['patients']) })
const deleteMutation  = useMutation({ mutationFn: deletePatient,  onSuccess: () => queryClient.invalidateQueries(['patients']) })
```

---

## API layer additions (frontend)

```typescript
// api/patients.ts
export const updatePatient = (id: string, data: UpdatePatientPayload) =>
  client.put(`/api/patients/${id}`, data).then(r => r.data)

export const deletePatient = (id: string) =>
  client.delete(`/api/patients/${id}`)
```

---

## Files to create / modify

| File | Change |
|---|---|
| `patient-service/src/patients/dto/update-patient.dto.ts` | new — partial DTO |
| `patient-service/src/patients/patients.controller.ts` | add PUT + DELETE |
| `patient-service/src/patients/patients.service.ts` | add update + delete methods |
| `patient-service/src/patients/patients.repository.ts` | add update + delete queries |
| `frontend/src/api/patients.ts` | add updatePatient + deletePatient |
| `frontend/src/pages/Dashboard.tsx` | add Add button + Edit/Delete per row |
| `frontend/src/components/PatientModal.tsx` | new — shared Add/Edit form modal |

---

## Error handling

| Case | Response |
|---|---|
| Patient not found (update/delete) | `404 Not Found` |
| Invalid body (missing required field) | `400 Bad Request` (class-validator) |
| Delete patient with active simulator | Simulator skips missing patientId silently |
