# /docker

Create all Docker and docker-compose files for local development.

Read `plans/fullstack-plan.md` before writing anything.

## Files to create

### `docker-compose.yml`
Services:
```
postgres:
  image: postgres:16-alpine
  env: POSTGRES_DB=medicaldb POSTGRES_USER POSTGRES_PASSWORD (from .env)
  volumes: postgres-data:/var/lib/postgresql/data
  healthcheck: pg_isready

redis:
  image: redis:7-alpine
  command: redis-server --requirepass ${REDIS_PASSWORD}
  volumes: redis-data:/data
  healthcheck: redis-cli ping

patient-service:
  build: ./patient-service
  depends_on: [postgres (healthy), redis (healthy)]
  env_file: ./patient-service/.env
  ports: 3001:3000

heart-rate-service:
  build: ./heart-rate-service
  depends_on: [postgres (healthy), redis (healthy)]
  env_file: ./heart-rate-service/.env
  ports: 3002:3000

analytics-service:
  build: ./analytics-service
  depends_on: [postgres (healthy), redis (healthy)]
  env_file: ./analytics-service/.env
  ports: 3003:3000

frontend:
  build: ./frontend
  depends_on: [patient-service, heart-rate-service, analytics-service]
  ports: 80:80

nginx:
  image: nginx:1.25-alpine
  volumes: ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
  depends_on: [patient-service, heart-rate-service, analytics-service, frontend]
  ports: 8080:80
```

volumes: postgres-data, redis-data

### `nginx/nginx.conf`
Upstream blocks + location routing that mirrors k8s Ingress:
```nginx
upstream patient_service   { server patient-service:3000; }
upstream heart_rate_service { server heart-rate-service:3000; }
upstream analytics_service  { server analytics-service:3000; }

server {
  listen 80;

  location /api/patients    { proxy_pass http://patient_service; }
  location /api/heart-rate  { proxy_pass http://heart_rate_service; }
  location /api/analytics   { proxy_pass http://analytics_service; }
  location /                { proxy_pass http://frontend:80; }
}
```

### `patient-service/Dockerfile`
Multi-stage:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
USER app
EXPOSE 3000
CMD ["node", "dist/main"]
```

Same pattern for `heart-rate-service/Dockerfile` and `analytics-service/Dockerfile`.

### `frontend/Dockerfile`
Multi-stage:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### `frontend/nginx.conf` (for static file serving inside container)
```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / { try_files $uri /index.html; }  # SPA fallback
}
```

### Root `.env.example`
```
POSTGRES_USER=medical
POSTGRES_PASSWORD=secret
POSTGRES_DB=medicaldb
REDIS_PASSWORD=redissecret
```

### Each service `.env.example`
```
DATABASE_URL=postgresql://medical:secret@postgres:5432/medicaldb
REDIS_URL=redis://:redissecret@redis:6379
PORT=3000
NODE_ENV=production
```

## Rules
- All services run as non-root user in production image
- healthcheck on postgres and redis — services won't start until infra is healthy
- No `docker-compose.override.yml` needed — keep single file simple
- `.env` files are in `.gitignore`, `.env.example` files are committed
- `npm ci` not `npm install` in Dockerfiles (reproducible builds)
- `npx prisma generate` in builder stage (generates Prisma client from schema)
