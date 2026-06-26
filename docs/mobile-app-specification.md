# SmartSupply AI — Mobile Application Specification

### Version: 1.0
### Last Updated: 2026-06-16

---

# 1. Overview

Two React Native mobile applications:
1. **SmartSupply Retailer** — For retailers, store owners, and store employees
2. **SmartSupply Supplier** — For suppliers, distributors, and manufacturers

Both apps share a common React Native codebase with role-based feature toggling.

---

# 2. Technology Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| React Native | Cross-platform framework | 0.76+ |
| Expo | Development framework | 52+ |
| TypeScript | Type safety | 5.x |
| React Navigation | Navigation | 7.x |
| TanStack Query | Server state | 5.x |
| Zustand | Client state | 5.x |
| React Native Paper / NativeWind | UI components | Latest |
| Expo Camera | Barcode/QR scanning | Latest |
| Expo Notifications | Push notifications | Latest |
| WatermelonDB | Offline-first local DB | Latest |
| React Native Voice | Voice search | Latest |
| React Native Charts Kit | Data visualization | Latest |

---

# 3. Retailer App Screens

## 3.1 Authentication (5 Screens)
| Screen | Description |
|--------|-------------|
| Login | Phone OTP + Email + Google |
| Register | Business registration |
| MFA Verify | 2FA code entry |
| Onboarding | Business setup wizard (3 steps) |
| Forgot Password | Password reset |

## 3.2 Dashboard (1 Screen + Widgets)
| Widget | Description |
|--------|-------------|
| Revenue Card | Today/week/month revenue |
| Stock Alerts | Low/zero/expiring stock count |
| Pending Orders | Orders awaiting action |
| Quick Actions | Stock In, Scan, Create PO |
| Top Products | Top 5 selling products |
| AI Insight | AI-generated daily tip |

## 3.3 Inventory (10 Screens)
| Screen | Description |
|--------|-------------|
| Product List | Searchable product grid/list |
| Product Detail | Product info + stock levels |
| Add/Edit Product | Product form with camera capture |
| Barcode Scanner | Camera-based scan → product lookup |
| Stock In | Record incoming stock |
| Stock Out | Record outgoing stock |
| Stock Adjustment | Adjust stock with reason |
| Low Stock | Products below reorder level |
| Expiring Soon | Products near expiry |
| Stock Count | Physical count with scanner |

## 3.4 Procurement (6 Screens)
| Screen | Description |
|--------|-------------|
| PO List | Purchase orders with status tabs |
| Create PO | Step-by-step PO creation |
| PO Detail | PO info, items, status |
| RFQ List | Request for quotations |
| Quotation Compare | Side-by-side comparison |
| Goods Receipt | Receive against PO with scanner |

## 3.5 Marketplace (8 Screens)
| Screen | Description |
|--------|-------------|
| Browse | Product grid with search & filters |
| Product Detail | Full product page |
| Supplier Profile | Supplier info + products |
| Compare | Product/supplier comparison |
| Cart | Multi-vendor shopping cart |
| Checkout | Address, payment, confirmation |
| Order Tracking | Shipment status & timeline |
| Order History | Past orders |

## 3.6 Analytics (4 Screens)
| Screen | Description |
|--------|-------------|
| Sales Dashboard | Revenue charts |
| Inventory Analytics | Stock health overview |
| Procurement Analytics | Spend analysis |
| Report View | Generated report viewer |

## 3.7 AI Assistant (3 Screens)
| Screen | Description |
|--------|-------------|
| Chat | AI conversation interface |
| Reorder Suggestions | AI-recommended reorders |
| Demand Forecast | Product demand charts |

## 3.8 Notifications (2 Screens)
| Screen | Description |
|--------|-------------|
| Notification List | All notifications |
| Preferences | Notification settings |

## 3.9 Settings (5 Screens)
| Screen | Description |
|--------|-------------|
| Profile | User profile editing |
| Organization | Business settings |
| Team | Team member management |
| Subscription | Plan & billing |
| Security | Password, MFA, biometrics |

**Retailer App Total: 44 Screens**

---

# 4. Supplier App Screens

## 4.1 Authentication (4 Screens)
Same as Retailer app

## 4.2 Dashboard (1 Screen + Widgets)
- Revenue, orders, ratings, pending shipments

## 4.3 Products (5 Screens)
| Screen | Description |
|--------|-------------|
| Product List | My products |
| Add/Edit Product | Product form |
| Pricing | Price management |
| Inventory Sync | Stock level updates |
| Bulk Upload | CSV/image upload |

## 4.4 Orders (5 Screens)
| Screen | Description |
|--------|-------------|
| Incoming Orders | New orders |
| Order Detail | Order info + actions |
| Process Order | Confirm, pack, ship |
| Order History | Past orders |
| Returns | Return requests |

## 4.5 Shipments (3 Screens)
| Screen | Description |
|--------|-------------|
| Create Shipment | Ship order |
| Active Shipments | In-transit items |
| Delivery Status | Tracking updates |

## 4.6 RFQ Responses (3 Screens)
| Screen | Description |
|--------|-------------|
| Pending RFQs | RFQs to respond to |
| Submit Quote | Quotation form |
| My Quotations | Submitted quotes |

## 4.7 Analytics (3 Screens)
- Sales, customers, product performance

## 4.8 Settings (4 Screens)
- Profile, business, verification, team

**Supplier App Total: 28 Screens**

---

# 5. Core Mobile Features

## 5.1 Barcode & QR Scanner

```
Camera → Frame Capture → Barcode Detection → Product Lookup → Action
                                                                │
                                              ┌────────────────┼────────────────┐
                                              │                │                │
                                        View Product    Stock In/Out    Add to Cart
```

**Supported Formats**: EAN-13, EAN-8, UPC-A, UPC-E, Code-128, Code-39, QR Code, Data Matrix

**Performance Target**: < 500ms scan-to-result

## 5.2 Offline Sync Strategy

```
┌──────────────────────────────────────────────────┐
│                    App Layer                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ UI       │  │ Business │  │ Sync     │      │
│  │ Layer    │──│ Logic    │──│ Engine   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                    │             │
│  ┌─────────────────────────────────┘             │
│  │                                               │
│  ▼                                               │
│  ┌──────────────────────────────────────┐       │
│  │         WatermelonDB (SQLite)        │       │
│  │  ┌─────────────────────────────────┐ │       │
│  │  │ Products │ Inventory │ Orders   │ │       │
│  │  │ Queue    │ Conflicts │ Metadata │ │       │
│  │  └─────────────────────────────────┘ │       │
│  └──────────────────────────────────────┘       │
└────────────────────┬─────────────────────────────┘
                     │
                     │ Sync when online
                     ▼
            ┌──────────────────┐
            │   SmartSupply    │
            │   Backend API    │
            └──────────────────┘
```

### Offline Capabilities
| Feature | Offline Support | Sync Strategy |
|---------|:--------------:|---------------|
| View Products | ✓ | Last sync cache |
| View Stock Levels | ✓ | Last sync cache |
| Record Stock In/Out | ✓ | Queue → sync when online |
| Scan Barcodes | ✓ | Local DB lookup |
| Create PO (Draft) | ✓ | Queue → sync when online |
| View Orders | ✓ | Last sync cache |
| Browse Marketplace | ✗ | Requires connection |
| AI Assistant | ✗ | Requires connection |
| Place Orders | ✗ | Requires connection |
| Notifications | ✗ | Requires connection |

### Conflict Resolution
- **Last-write-wins** for simple fields (product name, description)
- **Server-wins** for stock quantities (authoritative source)
- **Manual resolution** for complex conflicts (flagged for user)

## 5.3 Push Notifications

```
Backend Event → Kafka → Notification Service → FCM/APNs → Device
```

**Notification Categories**:
| Category | Priority | Sound | Badge |
|----------|----------|-------|-------|
| Low Stock Alert | High | Alert | ✓ |
| Expiry Alert | High | Alert | ✓ |
| New Order | High | Default | ✓ |
| Order Update | Normal | None | ✓ |
| Delivery Update | Normal | Default | ✓ |
| Payment Received | Normal | Default | ✓ |
| AI Suggestion | Low | None | ✗ |
| Promotion | Low | None | ✗ |

**Deep Linking**: All notifications deep-link to relevant screen:
```
smartsupply://inventory/product/{id}
smartsupply://orders/{id}
smartsupply://procurement/po/{id}
smartsupply://notifications/{id}
```

## 5.4 Voice Search

```
Microphone → Speech-to-Text (Google/Apple) → Text Query → Search API → Results
```

**Supported Languages**: English, Hindi, Tamil, Telugu, Marathi, Bengali
**Use Cases**:
- "Show stock for Parle-G"
- "Create purchase order for rice"
- "What's my revenue today?"
- "Find suppliers for electronics"

## 5.5 Biometric Authentication
- **iOS**: Face ID, Touch ID
- **Android**: Fingerprint, Face Unlock
- **Flow**: App foreground → biometric challenge → access granted

---

# 6. App Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Screens (UI)                      │
├─────────────────────────────────────────────────────┤
│                Navigation (React Navigation)         │
├─────────────────────────────────────────────────────┤
│  Hooks        │  Components    │  Forms              │
│  (useProduct, │  (ProductCard, │  (React Hook Form)  │
│   useStock,   │   StockBadge,  │                     │
│   useOrders)  │   ChartWidget) │                     │
├─────────────────────────────────────────────────────┤
│  State Management                                    │
│  ├── Server State (TanStack Query)                  │
│  └── Client State (Zustand)                         │
├─────────────────────────────────────────────────────┤
│  Services                                            │
│  ├── API Client (Axios)                             │
│  ├── Auth Service                                   │
│  ├── Storage Service                                │
│  ├── Notification Service                           │
│  └── Sync Service                                   │
├─────────────────────────────────────────────────────┤
│  Local Database (WatermelonDB)                      │
├─────────────────────────────────────────────────────┤
│  Native Modules                                      │
│  ├── Camera (Barcode Scanner)                       │
│  ├── Biometrics                                     │
│  ├── Push Notifications                             │
│  └── Voice Recognition                              │
└─────────────────────────────────────────────────────┘
```

---

# 7. Performance Targets

| Metric | Target |
|--------|--------|
| App Launch (cold start) | < 2 seconds |
| Screen Transition | < 300ms |
| Barcode Scan | < 500ms |
| API Call (cached) | < 100ms |
| API Call (network) | < 1 second |
| Offline Data Access | < 50ms |
| Push Notification Delivery | < 5 seconds |
| App Size (initial) | < 50 MB |
| Memory Usage | < 200 MB |
| Battery Drain | < 5%/hour active use |

---

# 8. Platform Support

| Platform | Minimum Version |
|----------|----------------|
| iOS | 15.0+ |
| Android | API 26 (Android 8.0)+ |

---

# 9. App Distribution

| Channel | Platform |
|---------|----------|
| Apple App Store | iOS |
| Google Play Store | Android |
| Direct APK | Android (enterprise) |
| CodePush | OTA updates (non-native) |
