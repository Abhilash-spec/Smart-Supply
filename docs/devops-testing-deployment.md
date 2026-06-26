# SmartSupply AI — DevOps, Testing, Monitoring & Deployment

### Version: 1.0
### Last Updated: 2026-06-16

---

# PART A: DEVOPS ARCHITECTURE

---

## 1. Docker Setup

### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .

FROM base AS production
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable pnpm && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose (Local Development)
```yaml
# docker-compose.yml
version: '3.9'
services:
  # PostgreSQL (local alternative to Supabase)
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: smartsupply
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01_schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Elasticsearch
  elasticsearch:
    image: elasticsearch:8.15.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  # Kafka (using KRaft mode)
  kafka:
    image: apache/kafka:3.8.0
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
      CLUSTER_ID: SmartSupplyAIKafkaCluster001
    volumes:
      - kafka_data:/var/lib/kafka/data

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/smartsupply
      REDIS_URL: redis://redis:6379
      ELASTICSEARCH_URL: http://elasticsearch:9200
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_KEY: ${SUPABASE_KEY}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ./backend:/app

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
      NEXT_PUBLIC_SUPABASE_URL: ${SUPABASE_URL}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY}
    depends_on:
      - backend

  # Prometheus
  prometheus:
    image: prom/prometheus:v2.54.0
    ports:
      - "9090:9090"
    volumes:
      - ./infrastructure/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  # Grafana
  grafana:
    image: grafana/grafana:11.2.0
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infrastructure/monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards

volumes:
  postgres_data:
  redis_data:
  es_data:
  kafka_data:
  prometheus_data:
  grafana_data:
```

---

## 2. Kubernetes Deployment

### Namespace
```yaml
# kubernetes/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: smartsupply
  labels:
    app: smartsupply
    environment: production
```

### Backend Deployment
```yaml
# kubernetes/base/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
  namespace: smartsupply
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
    spec:
      containers:
        - name: backend-api
          image: ghcr.io/smartsupply/backend:latest
          ports:
            - containerPort: 8000
          envFrom:
            - configMapRef:
                name: backend-config
            - secretRef:
                name: backend-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 10"]
---
apiVersion: v1
kind: Service
metadata:
  name: backend-api
  namespace: smartsupply
spec:
  selector:
    app: backend-api
  ports:
    - port: 80
      targetPort: 8000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-api-hpa
  namespace: smartsupply
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### Ingress
```yaml
# kubernetes/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: smartsupply-ingress
  namespace: smartsupply
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - api.smartsupply.ai
        - app.smartsupply.ai
      secretName: smartsupply-tls
  rules:
    - host: api.smartsupply.ai
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend-api
                port:
                  number: 80
    - host: app.smartsupply.ai
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

---

## 3. Terraform Infrastructure

### Main Configuration
```hcl
# terraform/main.tf
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "smartsupply-terraform-state"
    key    = "production/terraform.tfstate"
    region = "ap-south-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
module "vpc" {
  source             = "./modules/vpc"
  environment        = var.environment
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
}

# EKS Cluster
module "eks" {
  source          = "./modules/eks"
  environment     = var.environment
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  node_groups = {
    general = {
      instance_types = ["t3.large"]
      min_size       = 3
      max_size       = 20
      desired_size   = 5
    }
    compute = {
      instance_types = ["c5.xlarge"]
      min_size       = 2
      max_size       = 10
      desired_size   = 3
      labels         = { workload = "compute" }
    }
  }
}

# ElastiCache (Redis)
module "elasticache" {
  source             = "./modules/elasticache"
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  node_type          = "cache.r6g.large"
  num_cache_clusters = 3
}

# S3 Buckets
module "s3" {
  source      = "./modules/s3"
  environment = var.environment
  buckets = {
    uploads = { versioning = true, lifecycle_days = 365 }
    backups = { versioning = true, lifecycle_days = 90 }
    static  = { public = true, cdn = true }
  }
}

# MSK (Kafka)
module "msk" {
  source         = "./modules/msk"
  environment    = var.environment
  vpc_id         = module.vpc.vpc_id
  subnet_ids     = module.vpc.private_subnet_ids
  broker_count   = 3
  instance_type  = "kafka.m5.large"
}
```

---

## 4. CI/CD Pipelines

### Backend CI
```yaml
# .github/workflows/backend-ci.yml
name: Backend CI
on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: |
          pip install uv
          cd backend && uv sync

      - name: Lint
        run: cd backend && uv run ruff check . && uv run mypy .

      - name: Test
        run: cd backend && uv run pytest --cov=. --cov-report=xml -v
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  build-and-push:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: ./backend
          push: true
          tags: ghcr.io/smartsupply/backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Frontend CI
```yaml
# .github/workflows/frontend-ci.yml
name: Frontend CI
on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']
  pull_request:
    branches: [main]
    paths: ['frontend/**']

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          cache-dependency-path: frontend/pnpm-lock.yaml

      - name: Install
        run: cd frontend && pnpm install --frozen-lockfile

      - name: Lint
        run: cd frontend && pnpm lint

      - name: Type Check
        run: cd frontend && pnpm tsc --noEmit

      - name: Test
        run: cd frontend && pnpm test --coverage

      - name: Build
        run: cd frontend && pnpm build

  e2e:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: cd frontend && pnpm install --frozen-lockfile
      - run: cd frontend && pnpm exec playwright install --with-deps
      - run: cd frontend && pnpm exec playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-results
          path: frontend/test-results/
```

### Deploy to Production
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production
on:
  workflow_dispatch:
    inputs:
      backend_tag:
        description: 'Backend image tag'
        required: true
      frontend_tag:
        description: 'Frontend image tag'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-south-1

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name smartsupply-production

      - name: Deploy Backend
        run: |
          kubectl set image deployment/backend-api \
            backend-api=ghcr.io/smartsupply/backend:${{ inputs.backend_tag }} \
            -n smartsupply
          kubectl rollout status deployment/backend-api -n smartsupply --timeout=300s

      - name: Deploy Frontend
        run: |
          kubectl set image deployment/frontend \
            frontend=ghcr.io/smartsupply/frontend:${{ inputs.frontend_tag }} \
            -n smartsupply
          kubectl rollout status deployment/frontend -n smartsupply --timeout=300s

      - name: Run Smoke Tests
        run: |
          sleep 30
          curl -f https://api.smartsupply.ai/health || exit 1
          curl -f https://app.smartsupply.ai || exit 1

      - name: Notify
        if: always()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {"text": "Production deployment ${{ job.status }}: Backend ${{ inputs.backend_tag }}, Frontend ${{ inputs.frontend_tag }}"}
```

---

# PART B: TESTING STRATEGY

---

## 1. Testing Pyramid

```
                    ┌─────────┐
                    │   E2E   │  ← Playwright (critical flows)
                   ┌┴─────────┴┐
                   │Integration │  ← API + DB tests
                  ┌┴───────────┴┐
                  │  Unit Tests  │  ← pytest + Jest (bulk)
                 ┌┴─────────────┴┐
                 │  Static Analysis│  ← ruff, mypy, eslint, tsc
                 └────────────────┘
```

## 2. Testing Requirements

| Layer | Tool | Coverage Target | Run On |
|-------|------|:--------------:|--------|
| Static Analysis (Backend) | ruff + mypy | 100% | Every PR |
| Static Analysis (Frontend) | ESLint + TypeScript | 100% | Every PR |
| Unit Tests (Backend) | pytest | > 80% | Every PR |
| Unit Tests (Frontend) | Jest + React Testing Library | > 80% | Every PR |
| Integration Tests | pytest + httpx | > 60% | Every PR |
| API Contract Tests | schemathesis | 100% endpoints | Nightly |
| E2E Tests | Playwright | Critical flows | Pre-deploy |
| Load Tests | k6 | Target SLAs | Weekly |
| Security Tests | OWASP ZAP + Bandit | Critical/High: 0 | Weekly |
| Visual Regression | Playwright screenshots | Key pages | Pre-deploy |

## 3. Load Testing Scenarios (k6)

| Scenario | Virtual Users | Duration | Success Criteria |
|----------|:------------:|:--------:|-----------------|
| Normal Load | 500 | 30 min | p95 < 200ms, error < 0.1% |
| Peak Load | 2000 | 15 min | p95 < 500ms, error < 0.5% |
| Stress Test | 5000 | 10 min | Graceful degradation |
| Spike Test | 0→3000→0 | 5 min | Recovery < 2 min |
| Endurance | 1000 | 4 hours | No memory leaks |

---

# PART C: MONITORING STRATEGY

---

## 1. Monitoring Stack

```
Applications → OpenTelemetry → Prometheus (metrics) → Grafana (dashboards)
                             → Elasticsearch (logs) → Kibana (log analysis)
                             → Jaeger (traces) → Grafana (trace visualization)
                             → AlertManager → PagerDuty/Slack (alerts)
```

## 2. Key Metrics

### Infrastructure Metrics
| Metric | Warning | Critical |
|--------|:-------:|:--------:|
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 75% | > 90% |
| Disk Usage | > 80% | > 90% |
| Pod Restart Count | > 3/hour | > 10/hour |

### Application Metrics
| Metric | Warning | Critical |
|--------|:-------:|:--------:|
| API Latency (p95) | > 200ms | > 500ms |
| API Latency (p99) | > 500ms | > 1000ms |
| Error Rate (5xx) | > 0.1% | > 1% |
| Request Rate Drop | > 30% drop | > 50% drop |

### Business Metrics
| Metric | Dashboard | Alert |
|--------|-----------|-------|
| Active Users (real-time) | ✓ | Drop > 40% |
| Orders per minute | ✓ | Drop > 50% |
| Payment success rate | ✓ | < 95% |
| Search latency | ✓ | > 500ms |
| Signup conversion | ✓ | Drop > 30% |

## 3. Alerting Rules

| Alert | Condition | Severity | Notify |
|-------|-----------|----------|--------|
| High Error Rate | 5xx rate > 1% for 5 min | P1 | PagerDuty + Slack |
| API Down | Health check fails 3x | P1 | PagerDuty + Slack |
| Database Connection Pool | > 90% used | P2 | Slack |
| Kafka Consumer Lag | > 10,000 messages | P2 | Slack |
| Disk Space Low | > 85% | P2 | Slack |
| SSL Certificate Expiry | < 14 days | P3 | Email |
| Slow Queries | > 5s for 10+ queries/min | P3 | Slack |

---

# PART D: DEPLOYMENT GUIDE

---

## 1. Local Development Setup

```bash
# Prerequisites: Docker, Node.js 22+, Python 3.12+, pnpm

# 1. Clone repository
git clone https://github.com/smartsupply/smartsupply-ai.git
cd smartsupply-ai

# 2. Copy environment files
cp .env.example .env
# Edit .env with Supabase credentials, API keys

# 3. Start infrastructure services
docker compose up -d postgres redis elasticsearch kafka

# 4. Setup backend
cd backend
pip install uv
uv sync
uv run alembic upgrade head    # Run migrations
uv run python seed.py          # Seed data
uv run uvicorn main:app --reload --port 8000

# 5. Setup frontend (new terminal)
cd frontend
pnpm install
pnpm dev                       # Starts on http://localhost:3000
```

## 2. Environment Variables

| Variable | Description | Required |
|----------|------------|:--------:|
| `DATABASE_URL` | PostgreSQL connection string | ✓ |
| `SUPABASE_URL` | Supabase project URL | ✓ |
| `SUPABASE_KEY` | Supabase service role key | ✓ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | ✓ |
| `REDIS_URL` | Redis connection string | ✓ |
| `ELASTICSEARCH_URL` | Elasticsearch URL | ✓ |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker addresses | ✓ |
| `JWT_SECRET` | JWT signing secret (256-bit) | ✓ |
| `OPENAI_API_KEY` | OpenAI API key | AI features |
| `RAZORPAY_KEY_ID` | Razorpay API key | Payments |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | Payments |
| `SENDGRID_API_KEY` | SendGrid API key | Email |
| `TWILIO_ACCOUNT_SID` | Twilio SID | SMS |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | SMS |

## 3. Database Migration Strategy

```bash
# Create new migration
uv run alembic revision --autogenerate -m "add_new_table"

# Apply migrations
uv run alembic upgrade head

# Rollback one step
uv run alembic downgrade -1

# View migration history
uv run alembic history
```

**Zero-Downtime Migration Rules**:
1. Never rename columns — add new, migrate data, drop old
2. Never drop columns in same release — mark deprecated, remove next release
3. Always add columns as nullable or with defaults
4. Use online DDL for large tables
5. Test migrations against production-size data

## 4. Production Deployment Checklist

- [ ] All CI/CD checks pass
- [ ] Database migrations tested in staging
- [ ] Load tests meet SLA targets
- [ ] Security scan clean (no critical/high)
- [ ] Feature flags configured
- [ ] Monitoring dashboards verified
- [ ] Rollback plan documented
- [ ] Team notified of deployment window
- [ ] Smoke tests prepared
- [ ] On-call engineer available

---

# PART E: PRODUCTION IMPLEMENTATION PLAN

---

## 1. Team Structure (Recommended)

| Role | Count | Responsibility |
|------|:-----:|---------------|
| Engineering Manager | 1 | Technical leadership |
| Backend Engineers | 4 | FastAPI services |
| Frontend Engineers | 3 | Next.js + React |
| Mobile Engineers | 2 | React Native |
| AI/ML Engineer | 1 | Forecasting, RAG, ML pipeline |
| DevOps Engineer | 1 | Infrastructure, CI/CD |
| QA Engineer | 2 | Testing automation |
| UI/UX Designer | 1 | Design system, UX |
| Product Manager | 1 | Requirements, prioritization |
| **Total** | **16** | |

## 2. 6-Month Sprint Plan

### Month 1-2: Foundation
- Sprint 1-2: Auth, User, Org services + frontend shell
- Sprint 3-4: Product catalog + basic inventory

### Month 3-4: Core Features
- Sprint 5-6: Full inventory management
- Sprint 7-8: Supplier marketplace (discovery + listings)
- Sprint 9: Procurement (POs, basic approvals)

### Month 5-6: Polish & Launch
- Sprint 10: Analytics & dashboards
- Sprint 11: Notifications, admin panel
- Sprint 12: Testing, performance, security audit
- Sprint 13: Beta launch, monitoring, bug fixes

### Post-Launch (Month 7-12)
- Marketplace commerce (cart, checkout)
- AI forecasting engine
- Mobile apps
- Financial features

## 3. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|:---------:|:------:|-----------|
| Scope creep | High | High | Strict phase boundaries, MVP first |
| Tech complexity | Medium | High | Proven tech stack, incremental delivery |
| Supabase limits | Medium | Medium | Architect for provider independence |
| AI accuracy | Medium | Medium | Start with rule-based, add ML gradually |
| Team scaling | Medium | Medium | Strong documentation, modular architecture |
| Security breach | Low | Critical | Security-first design, regular audits |
| Performance issues | Medium | High | Load testing from Sprint 8 onward |

## 4. Go-to-Market Timeline

```
Month 1-6:  Build Phase 1 MVP
Month 5:    Private Beta (50 retailers)
Month 6:    Public Beta (500 retailers)
Month 7:    General Availability
Month 8-12: Growth Phase (features + scale)
Month 13+:  Scale Phase (AI + mobile + expansion)
```
