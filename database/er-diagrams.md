# SmartSupply AI — Entity Relationship Diagrams

### Version: 1.0
### Last Updated: 2026-06-16

---

# 1. Core Domain Relationships

```mermaid
erDiagram
    TENANTS ||--o{ ORGANIZATIONS : "has many"
    TENANTS ||--o{ USERS : "has many"
    TENANTS ||--o{ SUBSCRIPTIONS : "has one"

    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : "has many"
    ORGANIZATIONS ||--o{ PRODUCTS : "has many"
    ORGANIZATIONS ||--o{ WAREHOUSES : "has many"
    ORGANIZATIONS ||--o{ PURCHASE_ORDERS : "creates"
    ORGANIZATIONS ||--o{ ORDERS : "places"

    USERS ||--o{ ORGANIZATION_MEMBERS : "belongs to"
    USERS ||--o{ USER_SESSIONS : "has many"
    USERS ||--o{ USER_ROLES : "has many"

    ROLES ||--o{ ROLE_PERMISSIONS : "has many"
    ROLES ||--o{ USER_ROLES : "assigned to"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "granted via"
```

---

# 2. Product Catalog Domain

```mermaid
erDiagram
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has variants"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "has images"
    PRODUCTS ||--o{ PRODUCT_ATTRIBUTE_VALUES : "has attributes"
    PRODUCTS ||--o{ INVENTORY_ITEMS : "tracked in"
    PRODUCTS }o--|| CATEGORIES : "belongs to"
    PRODUCTS }o--|| BRANDS : "manufactured by"
    PRODUCTS }o--|| UNITS_OF_MEASURE : "measured in"
    PRODUCTS }o--|| TAX_CATEGORIES : "taxed as"

    CATEGORIES ||--o{ CATEGORIES : "parent-child"

    PRODUCT_ATTRIBUTES ||--o{ PRODUCT_ATTRIBUTE_VALUES : "defines"

    PRODUCT_BUNDLES ||--o{ PRODUCT_BUNDLE_ITEMS : "contains"
    PRODUCT_BUNDLE_ITEMS }o--|| PRODUCTS : "includes"

    PRODUCTS ||--o{ PRODUCT_PRICE_HISTORY : "price changes"
    PRODUCTS ||--o{ PRODUCT_TAG_ASSIGNMENTS : "tagged"
    PRODUCT_TAGS ||--o{ PRODUCT_TAG_ASSIGNMENTS : "applied to"
```

---

# 3. Inventory Domain

```mermaid
erDiagram
    WAREHOUSES ||--o{ WAREHOUSE_LOCATIONS : "has locations"
    WAREHOUSES ||--o{ INVENTORY_ITEMS : "stores"

    WAREHOUSE_LOCATIONS ||--o{ WAREHOUSE_LOCATIONS : "parent-child"

    INVENTORY_ITEMS }o--|| PRODUCTS : "for product"
    INVENTORY_ITEMS }o--|| WAREHOUSES : "in warehouse"
    INVENTORY_ITEMS }o--o| WAREHOUSE_LOCATIONS : "at location"

    PRODUCTS ||--o{ STOCK_MOVEMENTS : "moved"
    PRODUCTS ||--o{ BATCHES : "batched"
    PRODUCTS ||--o{ SERIAL_NUMBERS : "serialized"
    PRODUCTS ||--o{ REORDER_RULES : "reorder config"

    STOCK_ADJUSTMENTS ||--o{ STOCK_ADJUSTMENT_ITEMS : "items"
    STOCK_TRANSFERS ||--o{ STOCK_TRANSFER_ITEMS : "items"
    STOCK_COUNTS ||--o{ STOCK_COUNT_ITEMS : "items"

    PRODUCTS ||--o{ LOW_STOCK_ALERTS : "alerts"
    BATCHES ||--o{ EXPIRY_ALERTS : "expiry alerts"
    PRODUCTS ||--o{ INVENTORY_SNAPSHOTS : "daily snapshot"
    PRODUCTS ||--o{ INVENTORY_RESERVATIONS : "reserved"
```

---

# 4. Supplier & Marketplace Domain

```mermaid
erDiagram
    ORGANIZATIONS ||--|| SUPPLIER_PROFILES : "is supplier"

    SUPPLIER_PROFILES ||--o{ SUPPLIER_PRODUCTS : "offers"
    SUPPLIER_PROFILES ||--o{ SUPPLIER_CERTIFICATIONS : "certified by"
    SUPPLIER_PROFILES ||--o{ SUPPLIER_RATINGS : "rated"
    SUPPLIER_PROFILES ||--o{ SUPPLIER_DELIVERY_ZONES : "delivers to"
    SUPPLIER_PROFILES ||--o{ SUPPLIER_PERFORMANCE_METRICS : "tracked"
    SUPPLIER_PROFILES ||--o{ SUPPLIER_VERIFICATION_DOCUMENTS : "documents"

    SUPPLIER_PRODUCTS ||--o{ SUPPLIER_PRICING : "priced at"
    SUPPLIER_PRODUCTS ||--|| SUPPLIER_INVENTORY : "stock level"

    SUPPLIER_PROFILES ||--o{ MARKETPLACE_LISTINGS : "lists"
    MARKETPLACE_LISTINGS }o--|| SUPPLIER_PRODUCTS : "for product"

    USERS ||--o{ CART_ITEMS : "in cart"
    CART_ITEMS }o--|| MARKETPLACE_LISTINGS : "listing"

    USERS ||--o{ WISHLISTS : "wishlisted"

    SUPPLIER_RATINGS ||--o{ SUPPLIER_RATING_RESPONSES : "responded"
    SUPPLIER_CONNECTIONS }o--|| ORGANIZATIONS : "retailer"
    SUPPLIER_CONNECTIONS }o--|| SUPPLIER_PROFILES : "supplier"
```

---

# 5. Procurement Domain

```mermaid
erDiagram
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : "contains"
    PURCHASE_ORDERS ||--o{ PO_STATUS_HISTORY : "status changes"
    PURCHASE_ORDERS ||--o{ GOODS_RECEIPTS : "received via"
    PURCHASE_ORDERS }o--|| SUPPLIER_PROFILES : "from supplier"
    PURCHASE_ORDERS }o--|| WAREHOUSES : "to warehouse"

    GOODS_RECEIPTS ||--o{ GOODS_RECEIPT_ITEMS : "items"
    GOODS_RECEIPT_ITEMS }o--|| PURCHASE_ORDER_ITEMS : "for PO item"

    RFQS ||--o{ RFQ_ITEMS : "requesting"
    RFQS ||--o{ QUOTATIONS : "receives"
    QUOTATIONS ||--o{ QUOTATION_ITEMS : "line items"
    QUOTATION_ITEMS }o--|| RFQ_ITEMS : "quotes on"

    APPROVAL_WORKFLOWS ||--o{ APPROVAL_STEPS : "steps"
    APPROVAL_WORKFLOWS ||--o{ APPROVAL_REQUESTS : "triggered"
    APPROVAL_REQUESTS ||--o{ APPROVAL_ACTIONS : "actioned"

    PO_TEMPLATES }o--|| SUPPLIER_PROFILES : "for supplier"
```

---

# 6. Orders & Fulfillment Domain

```mermaid
erDiagram
    ORDERS ||--o{ ORDER_ITEMS : "contains"
    ORDERS ||--o{ ORDER_STATUS_HISTORY : "status log"
    ORDERS ||--o{ ORDER_NOTES : "notes"
    ORDERS ||--o{ SHIPMENTS : "shipped via"
    ORDERS ||--o{ RETURNS : "returned"
    ORDERS }o--|| ORGANIZATIONS : "buyer"
    ORDERS }o--|| SUPPLIER_PROFILES : "seller"
    ORDERS }o--o| PROMOTIONS : "promotion applied"

    RETURNS ||--o{ RETURN_ITEMS : "items"
    RETURN_ITEMS }o--|| ORDER_ITEMS : "for item"

    SHIPMENTS ||--o{ SHIPMENT_ITEMS : "items"
    SHIPMENTS ||--o{ SHIPMENT_TRACKING : "tracking events"
    SHIPMENTS ||--o{ DELIVERY_ASSIGNMENTS : "assigned to"

    DELIVERY_ASSIGNMENTS ||--o| PROOF_OF_DELIVERY : "proof"
    DELIVERY_ASSIGNMENTS }o--|| USERS : "delivery partner"
```

---

# 7. Payments & Finance Domain

```mermaid
erDiagram
    ORDERS ||--o{ PAYMENT_TRANSACTIONS : "paid via"
    PAYMENT_TRANSACTIONS }o--o| ORDERS : "for order"

    ORGANIZATIONS ||--o{ PAYMENT_METHODS : "has methods"
    ORGANIZATIONS ||--o{ INVOICES : "generates"
    ORGANIZATIONS ||--o{ CREDIT_ACCOUNTS : "credit"

    CREDIT_ACCOUNTS ||--o{ CREDIT_TRANSACTIONS : "transactions"

    ORDERS ||--o{ INVOICES : "invoiced"
    ORDERS ||--o{ REFUNDS : "refunded"

    SUPPLIER_PROFILES ||--o{ SETTLEMENTS : "settled"

    ORGANIZATIONS ||--o{ BNPL_RECORDS : "bnpl"
    ORGANIZATIONS ||--o{ TAX_RECORDS : "tax"
```

---

# 8. AI & Forecasting Domain

```mermaid
erDiagram
    FORECAST_MODELS ||--o{ TRAINING_JOBS : "trained by"
    FORECAST_MODELS ||--o{ PREDICTIONS : "generates"

    PRODUCTS ||--o{ PREDICTIONS : "predicted"
    PRODUCTS ||--o{ PREDICTION_ACCURACY : "accuracy"
    PRODUCTS ||--o{ REORDER_SUGGESTIONS : "suggestions"

    USERS ||--o{ COPILOT_CONVERSATIONS : "chats"
    COPILOT_CONVERSATIONS ||--o{ COPILOT_MESSAGES : "messages"

    PRODUCTS ||--o{ VECTOR_EMBEDDINGS : "embedded"
    PRODUCTS ||--o{ FEATURE_STORE : "features"
    PRODUCTS ||--o{ RECOMMENDATIONS : "recommended"
```

---

# 9. Cross-Domain Relationship Summary

| From Domain | To Domain | Relationship |
|------------|-----------|-------------|
| Tenants | All | Every entity belongs to a tenant |
| Users | Auth | Users have sessions, MFA, OAuth |
| Users | RBAC | Users have roles and permissions |
| Organizations | Products | Organizations own products |
| Organizations | Suppliers | Organizations can be suppliers |
| Products | Inventory | Products are tracked in inventory |
| Products | Marketplace | Products are listed on marketplace |
| Suppliers | Procurement | POs are sent to suppliers |
| Suppliers | Orders | Orders fulfilled by suppliers |
| Orders | Payments | Orders are paid via transactions |
| Orders | Shipments | Orders are shipped |
| Orders | Returns | Orders can be returned |
| Products | AI | Products have forecasts |
| All Entities | Audit | All changes are audit logged |
| All Entities | Notifications | Events trigger notifications |

---

# 10. Table Count Summary

| Domain | Table Count |
|--------|:-----------:|
| Tenants & Platform | 5 |
| Authentication & Identity | 12 |
| Organizations | 12 |
| RBAC | 6 |
| Subscriptions & Billing | 10 |
| Product Catalog | 18 |
| Inventory | 20 |
| Suppliers | 12 |
| Marketplace | 12 |
| Procurement | 15 |
| Orders & Fulfillment | 12 |
| Payments & Finance | 10 |
| Notifications | 6 |
| AI & Forecasting | 10 |
| Analytics & Reporting | 8 |
| Documents & Contracts | 6 |
| Audit & Compliance | 5 |
| Admin & Support | 6 |
| **Total** | **201** |
