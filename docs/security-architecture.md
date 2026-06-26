# SmartSupply AI — Security Architecture

### Version: 1.0
### Last Updated: 2026-06-16

---

# 1. Security Overview

SmartSupply AI implements a defense-in-depth security model with multiple layers of protection covering authentication, authorization, data protection, network security, application security, and compliance.

---

# 2. Authentication Security

## 2.1 Password Policy
| Rule | Requirement |
|------|------------|
| Minimum Length | 8 characters |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit, 1 special character |
| History | Cannot reuse last 5 passwords |
| Expiry | 90 days (configurable per tenant) |
| Lockout | 5 failed attempts → 15 min lockout |
| Brute Force Protection | Progressive delays: 1s, 2s, 4s, 8s, 16s |

## 2.2 Session Management
| Parameter | Value |
|-----------|-------|
| Access Token Lifetime | 15 minutes |
| Refresh Token Lifetime | 30 days |
| Session Timeout (Idle) | 30 minutes (configurable) |
| Concurrent Sessions | Max 5 per user |
| Session Binding | IP + User-Agent fingerprint |
| Secure Flags | HttpOnly, Secure, SameSite=Strict |

## 2.3 Multi-Factor Authentication
- **TOTP**: RFC 6238 compliant, 6-digit codes, 30-second window
- **SMS OTP**: 6-digit codes, 5-minute expiry, rate limited to 5/hour
- **Email OTP**: 6-digit codes, 10-minute expiry
- **Recovery Codes**: 10 single-use recovery codes generated at MFA setup

## 2.4 OAuth 2.0 / SSO
- Google OAuth 2.0 with PKCE
- Future: SAML 2.0 for enterprise SSO
- Token exchange pattern for OAuth → internal JWT

---

# 3. Authorization — RBAC Implementation

## 3.1 Permission Model

```
Tenant → Organization → Team → User → Role → Permission → Resource
```

## 3.2 Permission Format

```
resource:action[:scope]

Examples:
  inventory:read              — Read all inventory
  inventory:write             — Create/update inventory
  inventory:delete            — Delete inventory
  orders:read:own             — Read own orders only
  orders:read:team            — Read team's orders
  orders:read:org             — Read organization's orders
  analytics:read:advanced     — Read advanced analytics
```

## 3.3 Full Permission Registry

| Resource | Actions | Scopes |
|----------|---------|--------|
| users | read, write, delete, invite | own, team, org |
| organizations | read, write, delete | own |
| products | read, write, delete, import, export | own, org |
| inventory | read, write, adjust, transfer, count | own, location, org |
| purchase_orders | read, write, delete, approve, submit | own, team, org |
| rfqs | read, write, delete, send | own, org |
| quotations | read, write, submit | own, org |
| marketplace | read, search | all |
| listings | read, write, delete | own, org |
| cart | read, write | own |
| orders | read, write, cancel, return | own, team, org |
| shipments | read, write, assign, deliver | own, org |
| payments | read, write, refund | own, org |
| invoices | read, write, void | own, org |
| analytics | read:basic, read:advanced | org |
| forecasting | read, configure | org |
| copilot | chat, history | own |
| notifications | read, write, configure | own |
| settings | read, write | org |
| billing | read, write | org |
| roles | read, write, delete | org |
| audit | read | org |
| admin | all | platform |

## 3.4 API Middleware Authorization

```python
# Authorization middleware pattern
@router.get("/v1/products")
@require_permissions("products:read")
@require_tenant()
async def list_products(
    request: Request,
    current_user: User = Depends(get_current_user),
    tenant_id: UUID = Depends(get_tenant_id),
):
    # RLS automatically filters by tenant_id
    products = await product_service.list(tenant_id=tenant_id)
    return products
```

---

# 4. Data Protection

## 4.1 Encryption Standards

| Layer | Standard | Implementation |
|-------|---------|---------------|
| Data at Rest | AES-256 | Supabase PostgreSQL transparent encryption |
| Data in Transit | TLS 1.3 | All API and database connections |
| PII Fields | AES-256-GCM | Application-level field encryption |
| Passwords | bcrypt | Cost factor 12 |
| API Keys | SHA-256 | Hashed before storage |
| File Storage | AES-256 | Supabase Storage encryption |

## 4.2 PII Fields Requiring Encryption

| Field | Table | Type |
|-------|-------|------|
| Phone number | users | AES-256-GCM |
| GST Number | organizations | AES-256-GCM |
| Bank Account | payment_methods | AES-256-GCM |
| PAN Number | organizations | AES-256-GCM |
| Aadhaar Number | user_kyc | AES-256-GCM |

## 4.3 Data Classification

| Level | Classification | Examples | Handling |
|:-----:|---------------|----------|----------|
| L1 | Public | Product names, categories | No restrictions |
| L2 | Internal | Stock levels, order counts | Tenant-isolated |
| L3 | Confidential | User emails, phone numbers | Encrypted, audit logged |
| L4 | Restricted | Payment details, KYC docs | Encrypted, masked in logs, strict access |

---

# 5. Application Security

## 5.1 OWASP Top 10 Mitigations

| # | Vulnerability | Mitigation |
|:-:|--------------|------------|
| A01 | Broken Access Control | RBAC + RLS + middleware checks |
| A02 | Cryptographic Failures | AES-256, TLS 1.3, bcrypt |
| A03 | Injection | SQLAlchemy parameterized queries, input validation |
| A04 | Insecure Design | Security reviews, threat modeling |
| A05 | Security Misconfiguration | Hardened defaults, CSP headers, no debug in prod |
| A06 | Vulnerable Components | Automated dependency scanning (Dependabot) |
| A07 | Authentication Failures | MFA, rate limiting, account lockout |
| A08 | Software Integrity | Signed Docker images, CI/CD verification |
| A09 | Logging Failures | Comprehensive audit logging, SIEM integration |
| A10 | SSRF | URL validation, allowlisting external services |

## 5.2 HTTP Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

## 5.3 Input Validation

```python
# Pydantic model validation example
class CreateProductRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255, pattern=r"^[\w\s\-\.]+$")
    sku: str = Field(min_length=1, max_length=50, pattern=r"^[A-Z0-9\-]+$")
    price: Decimal = Field(ge=0, le=99999999.99, decimal_places=2)
    quantity: int = Field(ge=0, le=999999999)
    category_id: UUID
    description: Optional[str] = Field(max_length=5000, default=None)

    @field_validator('name')
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return bleach.clean(v)
```

## 5.4 Rate Limiting Strategy

| Endpoint Category | Limit | Window |
|-------------------|-------|--------|
| Auth (login, register) | 10 requests | 1 minute |
| Auth (OTP send) | 5 requests | 1 hour |
| Auth (MFA verify) | 5 attempts | 5 minutes |
| API (read) | Per plan tier | 1 minute |
| API (write) | Per plan tier / 2 | 1 minute |
| Search | 30 requests | 1 minute |
| File upload | 10 requests | 1 minute |
| AI Copilot | 20 requests | 1 hour |
| Webhook | 100 events | 1 minute |

## 5.5 CORS Configuration

```python
CORS_CONFIG = {
    "allow_origins": [
        "https://app.smartsupply.ai",
        "https://admin.smartsupply.ai",
        "https://*.smartsupply.ai",  # Custom tenant domains
    ],
    "allow_methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
    "allow_headers": ["Authorization", "Content-Type", "X-Tenant-ID", "X-Request-ID"],
    "allow_credentials": True,
    "max_age": 86400,
}
```

---

# 6. Audit Logging

## 6.1 Audit Log Structure

```json
{
  "log_id": "uuid",
  "tenant_id": "uuid",
  "user_id": "uuid",
  "action": "inventory.stock_in",
  "resource_type": "inventory_item",
  "resource_id": "uuid",
  "old_value": { "quantity": 50 },
  "new_value": { "quantity": 150 },
  "ip_address": "203.0.113.45",
  "user_agent": "Mozilla/5.0...",
  "session_id": "uuid",
  "timestamp": "2026-06-16T08:00:00Z",
  "metadata": {
    "reason": "Purchase receipt #PO-2026-001",
    "batch_id": "uuid"
  }
}
```

## 6.2 Audited Operations

| Category | Operations |
|----------|-----------|
| Auth | Login, logout, failed login, MFA enable/disable, password change |
| User | Create, update, delete, role change, status change |
| Organization | Create, update, settings change, member add/remove |
| Inventory | Stock in, stock out, adjustment, transfer, count |
| Products | Create, update, delete, price change |
| Orders | Create, status change, cancel, return |
| Purchase Orders | Create, approve, reject, submit, amend |
| Payments | Initiate, complete, refund |
| Settings | Any settings change |
| Admin | Tenant operations, moderation actions, feature toggles |

## 6.3 Retention Policy
- Audit logs: **7 years** (regulatory compliance)
- Security events: **3 years**
- Access logs: **1 year**
- Archived to cold storage after 90 days

---

# 7. Network Security

## 7.1 Architecture

```
Internet → CloudFlare/AWS WAF → Load Balancer → API Gateway → Service Mesh → Services
                                                                                 │
                                                                          Private Subnet
                                                                        (DB, Redis, Kafka)
```

## 7.2 Network Policies
- Database: Private subnet, no public access
- Redis: Private subnet, encrypted connections
- Kafka: Private subnet, SASL authentication
- Services: mTLS between services (service mesh)
- Ingress: TLS termination at load balancer

## 7.3 DDoS Protection
- CloudFlare/AWS Shield for L3/L4 protection
- API Gateway rate limiting for L7 protection
- Geo-blocking for non-target regions (configurable)

---

# 8. Fraud Detection

## 8.1 Detection Rules

| Rule | Trigger | Action |
|------|---------|--------|
| Impossible travel | Login from 2 countries < 1 hour | Challenge MFA, alert admin |
| Brute force | 10+ failed logins in 5 minutes | Lock account, notify user |
| Unusual activity | 10x normal API volume | Rate limit, alert admin |
| New device | Login from unrecognized device | MFA challenge, email alert |
| Bulk data export | Large data export request | Require approval, audit log |
| Price manipulation | Unusual price changes | Flag for review |
| Suspicious orders | Abnormal order patterns | Hold for review |

---

# 9. Compliance

## 9.1 Regulatory Compliance

| Regulation | Scope | Status |
|-----------|-------|--------|
| India DPDP Act 2023 | Personal data protection | Built-in |
| GDPR | EU data subjects (future) | Framework ready |
| PCI DSS | Payment card data | Razorpay/Stripe handles |
| SOC 2 Type II | Security controls | Architecture ready |
| GST Compliance | Tax invoicing | Built-in |

## 9.2 Data Subject Rights
- **Right to Access**: Export all personal data via settings
- **Right to Erasure**: Account deletion with data anonymization
- **Right to Portability**: Data export in JSON/CSV
- **Right to Rectification**: Profile editing and correction
- **Consent Management**: Cookie consent, marketing opt-in/out

---

# 10. Incident Response

## 10.1 Severity Levels

| Level | Definition | Response Time | Examples |
|:-----:|-----------|:------------:|---------|
| P1 | Critical | 15 minutes | Data breach, platform down |
| P2 | High | 1 hour | Auth service down, payment failures |
| P3 | Medium | 4 hours | Non-critical service degradation |
| P4 | Low | 24 hours | UI bugs, minor issues |

## 10.2 Response Workflow

```
Detection → Triage → Containment → Investigation → Remediation → Post-Mortem
```

## 10.3 Security Contacts
- Security team: security@smartsupply.ai
- Bug bounty: bugbounty@smartsupply.ai
- Responsible disclosure policy published at /security

---

# 11. Security Testing

| Test Type | Frequency | Tool |
|-----------|-----------|------|
| SAST (Static Analysis) | Every PR | SonarQube, Bandit |
| DAST (Dynamic Analysis) | Weekly | OWASP ZAP |
| Dependency Scanning | Daily | Dependabot, Snyk |
| Container Scanning | Every build | Trivy |
| Penetration Testing | Quarterly | External firm |
| Secret Scanning | Every commit | GitGuardian |
| Infrastructure Audit | Monthly | AWS Inspector / Scout Suite |
