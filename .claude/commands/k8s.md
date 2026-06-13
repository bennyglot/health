# /k8s

Create all Kubernetes manifest files under `k8s/`.

Read `plans/fullstack-plan.md` before writing anything.
Namespace for all resources: `medical`.

## Files to create

### `k8s/namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: medical
```

### `k8s/configmap.yaml`
Keys: `POSTGRES_DB`, `POSTGRES_HOST` (postgres.medical.svc.cluster.local), `REDIS_HOST` (redis.medical.svc.cluster.local), `NODE_ENV` (production).

### `k8s/secret.yaml`
Keys: `POSTGRES_USER`, `POSTGRES_PASSWORD`, `REDIS_PASSWORD`.
Values base64 encoded. Add comment: "Replace with real secrets or use Sealed Secrets / External Secrets Operator in production."

### `k8s/postgres/pvc.yaml`
PersistentVolumeClaim: 10Gi, ReadWriteOnce, storageClassName: standard.

### `k8s/postgres/statefulset.yaml`
StatefulSet (not Deployment — postgres needs stable identity).
- image: postgres:16-alpine
- env from ConfigMap + Secret
- volumeMount: /var/lib/postgresql/data → pvc
- readinessProbe: exec pg_isready
- livenessProbe: exec pg_isready (longer initialDelaySeconds)
- resources: requests cpu:250m mem:256Mi, limits cpu:500m mem:512Mi

### `k8s/postgres/service.yaml`
ClusterIP, port 5432.

### `k8s/redis/deployment.yaml`
- image: redis:7-alpine
- command: `["redis-server", "--requirepass", "$(REDIS_PASSWORD)"]`
- env REDIS_PASSWORD from Secret
- readinessProbe: exec redis-cli ping
- resources: requests cpu:100m mem:128Mi, limits cpu:200m mem:256Mi

### `k8s/redis/service.yaml`
ClusterIP, port 6379.

### `k8s/patient-service/deployment.yaml`
- image: patient-service:latest (imagePullPolicy: IfNotPresent for local)
- replicas: 2
- env: DATABASE_URL constructed from ConfigMap+Secret, REDIS_URL from ConfigMap+Secret, PORT:3000
- readinessProbe: httpGet /health port 3000 initialDelaySeconds:10
- livenessProbe: httpGet /health port 3000 initialDelaySeconds:30
- resources: requests cpu:100m mem:128Mi, limits cpu:250m mem:256Mi

### `k8s/patient-service/service.yaml`
ClusterIP, port 3000.

### `k8s/heart-rate-service/deployment.yaml`
Same pattern as patient-service. replicas: 2.

### `k8s/heart-rate-service/service.yaml`
ClusterIP, port 3000.

### `k8s/analytics-service/deployment.yaml`
Same pattern. replicas: 1 (HPA handles scaling).

### `k8s/analytics-service/service.yaml`
ClusterIP, port 3000.

### `k8s/analytics-service/hpa.yaml`
HorizontalPodAutoscaler:
- minReplicas: 1
- maxReplicas: 5
- metric: CPU utilization 70%
- scaleDown stabilizationWindowSeconds: 120

### `k8s/frontend/deployment.yaml`
- image: frontend:latest
- replicas: 2
- resources: requests cpu:50m mem:64Mi, limits cpu:100m mem:128Mi

### `k8s/frontend/service.yaml`
ClusterIP, port 80.

### `k8s/ingress.yaml`
nginx-ingress Ingress resource:
```yaml
annotations:
  kubernetes.io/ingress.class: nginx
  nginx.ingress.kubernetes.io/rewrite-target: /$2
rules:
- host: medical.local
  http:
    paths:
    - path: /api/patients(/|$)(.*)
      backend: patient-service:3000
    - path: /api/heart-rate(/|$)(.*)
      backend: heart-rate-service:3000
    - path: /api/analytics(/|$)(.*)
      backend: analytics-service:3000
    - path: /(.*)
      backend: frontend:80
```

## Rules
- All resources in namespace `medical`
- Every Deployment has both readinessProbe and livenessProbe
- Every container has resource requests AND limits
- Secrets never hardcoded — reference via secretKeyRef
- Add `app` and `component` labels to all resources (for kubectl filtering)
- Include deploy instructions comment at top of `k8s/ingress.yaml`: how to apply all manifests with `kubectl apply -f k8s/ -R`
