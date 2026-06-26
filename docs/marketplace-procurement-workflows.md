# SmartSupply AI — Marketplace & Procurement Workflows

### Version: 1.0
### Last Updated: 2026-06-16

---

# PART A: MARKETPLACE WORKFLOWS

---

## 1. Supplier Onboarding Flow

```mermaid
flowchart TD
    A[Supplier visits smartsupply.ai] --> B[Clicks 'Register as Supplier']
    B --> C[Enters business details]
    C --> D[Phone/Email verification]
    D --> E[Business profile creation]
    E --> F[Upload verification documents]
    F --> |GST Certificate, PAN, Trade License| G[Documents submitted]
    G --> H[Platform admin review queue]
    H --> I{Verification review}
    I --> |Approved| J[Supplier verified ✓]
    I --> |Rejected| K[Rejection with reason]
    I --> |More info needed| L[Request additional docs]
    K --> F
    L --> F
    J --> M[Profile activated on marketplace]
    M --> N[Add first products]
    N --> O[Create marketplace listings]
    O --> P[Supplier live on marketplace]
```

### Verification Checklist
| Document | Required | Auto-Verify |
|----------|:--------:|:-----------:|
| GST Certificate | ✓ | GST API lookup |
| PAN Card | ✓ | — |
| Trade License | Industry-specific | — |
| FSSAI License | Food products only | — |
| Drug License | Pharmaceuticals only | — |
| Bank Account | ✓ (for settlements) | Penny drop |
| Business Address Proof | ✓ | — |

---

## 2. Product Listing Flow

```mermaid
flowchart TD
    A[Supplier: Add Product] --> B[Enter product details]
    B --> C[Upload images]
    C --> D[Set pricing & MOQ]
    D --> E[Set availability & stock]
    E --> F[Configure delivery zones]
    F --> G[Preview listing]
    G --> H{Submit for review?}
    H --> |Yes| I[Submit to marketplace]
    H --> |No| J[Save as draft]
    I --> K{Auto-moderation check}
    K --> |Pass| L[Listing published ✓]
    K --> |Flagged| M[Manual review queue]
    M --> N{Admin review}
    N --> |Approved| L
    N --> |Rejected| O[Rejection with reason]
    O --> B
    L --> P[Product visible on marketplace]
    P --> Q[Indexed in search]
```

### Auto-Moderation Rules
| Rule | Check | Action |
|------|-------|--------|
| Prohibited keywords | Text scan | Block + flag |
| Image quality | Min 500x500px | Reject |
| Pricing anomaly | Price < 10% of category avg | Flag for review |
| Duplicate listing | Title + category similarity | Flag for review |
| Missing required fields | Validation rules | Block |
| Prohibited categories | Category blocklist | Block |

---

## 3. Search & Discovery Flow

```mermaid
flowchart TD
    A[Retailer: Search/Browse] --> B{Search or Browse?}
    B --> |Search| C[Enter search query]
    B --> |Browse| D[Select category]
    C --> E[Elasticsearch query]
    D --> F[Category filter]
    E --> G[Search results]
    F --> G
    G --> H[Apply filters]
    H --> |Price range| G
    H --> |Brand| G
    H --> |Rating| G
    H --> |Location| G
    H --> |Availability| G
    G --> I[View product detail]
    I --> J{Action}
    J --> |Add to Cart| K[Cart updated]
    J --> |Compare| L[Add to comparison]
    J --> |Save| M[Add to wishlist]
    J --> |Contact Supplier| N[Chat/enquiry]
```

### Search Ranking Factors
| Factor | Weight | Description |
|--------|:------:|-------------|
| Text relevance | 30% | TF-IDF score from Elasticsearch |
| Availability | 20% | In-stock products ranked higher |
| Supplier rating | 15% | Higher rated suppliers preferred |
| Price competitiveness | 15% | Close to category average |
| Recency | 10% | Newer listings get boost |
| Sponsored | 10% | Paid promoted listings |

---

## 4. Cart & Checkout Flow

```mermaid
flowchart TD
    A[View Cart] --> B[Review items by supplier]
    B --> C[Adjust quantities]
    C --> D[Remove unwanted items]
    D --> E[Proceed to Checkout]
    E --> F[Select delivery address]
    F --> G[Set delivery preferences per supplier]
    G --> H[Review order summary]
    H --> I{Apply coupon?}
    I --> |Yes| J[Enter coupon code]
    J --> K{Valid?}
    K --> |Yes| L[Discount applied]
    K --> |No| M[Error: Invalid coupon]
    I --> |No| L
    L --> N[Select payment method]
    N --> O{Payment method}
    O --> |Online| P[Razorpay payment page]
    O --> |Credit| Q[Check credit limit]
    O --> |COD| R[COD confirmation]
    P --> S{Payment result}
    S --> |Success| T[Order created]
    S --> |Failed| U[Retry payment]
    Q --> V{Credit available?}
    V --> |Yes| T
    V --> |No| W[Insufficient credit]
    R --> T
    T --> X[Split orders by supplier]
    X --> Y[Notify each supplier]
    Y --> Z[Order confirmation to buyer]
    Z --> AA[Track orders separately]
```

### Multi-Vendor Order Splitting
```python
def split_cart_to_orders(cart_items: list, buyer: Organization) -> list[Order]:
    """Split cart items into per-supplier orders."""
    supplier_groups = group_by(cart_items, key=lambda item: item.supplier_id)

    orders = []
    for supplier_id, items in supplier_groups.items():
        order = Order(
            order_number=generate_order_number(),
            buyer_org_id=buyer.id,
            supplier_id=supplier_id,
            items=items,
            subtotal=sum(item.quantity * item.unit_price for item in items),
            tax_amount=calculate_tax(items),
            shipping_amount=calculate_shipping(supplier_id, items, buyer.address),
        )
        order.total_amount = order.subtotal + order.tax_amount + order.shipping_amount
        orders.append(order)

    return orders
```

---

## 5. Order Fulfillment Flow

```mermaid
flowchart TD
    A[Order received by supplier] --> B[Supplier notified]
    B --> C{Supplier action}
    C --> |Accept| D[Order confirmed]
    C --> |Reject| E[Order cancelled]
    C --> |Partial accept| F[Partial order, notify buyer]
    D --> G[Pick items from inventory]
    G --> H[Pack items]
    H --> I[Generate shipping label]
    I --> J[Create shipment]
    J --> K{Delivery method}
    K --> |Own delivery| L[Assign delivery partner]
    K --> |Third-party| M[Book logistics partner]
    L --> N[Out for delivery]
    M --> N
    N --> O[Delivery tracking updates]
    O --> P[Delivered]
    P --> Q[Proof of delivery]
    Q --> R[Update order status]
    R --> S[Auto-update buyer inventory]
    S --> T[Request review from buyer]
    T --> U[Settlement processing]
```

---

## 6. Review & Rating Flow

```mermaid
flowchart TD
    A[Order delivered] --> B[Review prompt sent 48 hrs later]
    B --> C{Buyer submits review?}
    C --> |Yes| D[Enter ratings 1-5 stars]
    D --> E[Quality, Delivery, Pricing, Communication]
    E --> F[Write review text optional]
    F --> G[Submit review]
    G --> H{Auto-moderation}
    H --> |Pass| I[Review published]
    H --> |Flagged| J[Manual review]
    J --> K{Admin decision}
    K --> |Approve| I
    K --> |Reject| L[Review removed, buyer notified]
    I --> M[Supplier can respond]
    I --> N[Update supplier avg rating]
    C --> |No| O[Reminder after 7 days]
    O --> P[No further reminders]
```

---

## 7. Dispute Resolution Flow

```mermaid
flowchart TD
    A[Buyer raises dispute] --> B[Select reason]
    B --> |Wrong item| C
    B --> |Damaged| C
    B --> |Quality issue| C
    B --> |Not received| C
    B --> |Quantity mismatch| C
    C[Upload evidence photos] --> D[Dispute created]
    D --> E[Supplier notified]
    E --> F{Supplier response within 48h}
    F --> |Accept| G[Full/partial refund initiated]
    F --> |Counter| H[Counter-proposal to buyer]
    F --> |No response| I[Auto-escalate to admin]
    H --> J{Buyer accepts?}
    J --> |Yes| G
    J --> |No| I
    I --> K[Admin review]
    K --> L{Admin decision}
    L --> |Buyer favor| G
    L --> |Supplier favor| M[Dispute closed, no refund]
    L --> |Compromise| N[Partial refund]
    G --> O[Process refund]
    O --> P[Update supplier metrics]
```

---

# PART B: PROCUREMENT WORKFLOWS

---

## 1. Requisition to PO Flow

```mermaid
flowchart TD
    A[Identify procurement need] --> B{Source}
    B --> |AI suggestion| C[Review AI reorder suggestion]
    B --> |Low stock alert| D[Review low stock alert]
    B --> |Manual| E[Manual requisition]
    C --> F{Accept suggestion?}
    F --> |Yes| G[Pre-filled PO created]
    F --> |Modify| H[Edit quantities/supplier]
    D --> G
    E --> I[Select products & quantities]
    H --> I
    I --> J[Select supplier]
    J --> K{Source from marketplace?}
    K --> |Yes| L[Search marketplace listings]
    K --> |Known supplier| M[Select from connected suppliers]
    L --> N[Add items from listings]
    M --> N
    N --> O[Review PO draft]
    O --> P{Approval required?}
    P --> |Yes, above threshold| Q[Submit for approval]
    P --> |No| R[Submit PO to supplier]
    Q --> S[Approval workflow triggered]
    S --> T{Approved?}
    T --> |Yes| R
    T --> |Rejected| U[PO returned with comments]
    U --> O
    R --> V[PO sent to supplier]
    V --> W[Supplier acknowledges]
```

---

## 2. RFQ Flow

```mermaid
flowchart TD
    A[Identify need for competitive quotes] --> B[Create RFQ]
    B --> C[Add product requirements]
    C --> D[Set specifications & quantities]
    D --> E[Select target suppliers min 3]
    E --> F[Set response deadline]
    F --> G[Submit RFQ]
    G --> H[Suppliers notified]
    H --> I[Suppliers prepare quotations]
    I --> J[Quotations submitted]
    J --> K{All responses received?}
    K --> |No, deadline not reached| L[Wait]
    L --> |Reminder at 75% deadline| M[Send reminder]
    M --> J
    K --> |Deadline reached| N[Close RFQ for responses]
    N --> O[Comparison matrix generated]
    O --> P[Review quotations]
    P --> Q{Select winner}
    Q --> R[Accept quotation]
    R --> S[Notify winning supplier]
    S --> T[Auto-generate PO from quotation]
    T --> U[PO approval workflow]
    Q --> V[Reject other quotations]
    V --> W[Notify rejected suppliers]
```

### Quotation Comparison Matrix

| Criteria | Supplier A | Supplier B | Supplier C |
|----------|-----------|-----------|-----------|
| Unit Price | ₹85 🟢 | ₹90 | ₹95 |
| Total Amount | ₹8,500 🟢 | ₹9,000 | ₹9,500 |
| Delivery Days | 3 | 2 🟢 | 5 |
| MOQ | 100 🟢 | 200 | 100 🟢 |
| Payment Terms | 30 days | 15 days | 45 days 🟢 |
| Rating | 4.2⭐ | 4.8⭐ 🟢 | 3.9⭐ |
| **Recommendation** | **Best Price** | **Best Overall** | — |

---

## 3. Multi-Level Approval Workflow

```mermaid
flowchart TD
    A[PO submitted for approval] --> B{Amount check}
    B --> |Under ₹10,000| C[Auto-approved]
    B --> |₹10,000 - ₹50,000| D[Manager approval]
    B --> |₹50,000 - ₹2,00,000| E[Manager then Owner approval]
    B --> |Above ₹2,00,000| F[Manager then Owner then Finance approval]
    D --> G{Manager decision}
    G --> |Approve| C
    G --> |Reject| H[PO rejected with reason]
    G --> |Request changes| I[PO returned for modification]
    E --> G
    G --> J{Owner decision}
    J --> |Approve| C
    J --> |Reject| H
    F --> G
    G --> J
    J --> K{Finance decision}
    K --> |Approve| C
    K --> |Reject| H
    C --> L[PO sent to supplier]
```

### Approval Configuration

```python
approval_rules = [
    {
        "name": "Auto-approve small orders",
        "condition": {"total_amount": {"lt": 10000}},
        "steps": []  # Auto-approved
    },
    {
        "name": "Manager approval",
        "condition": {"total_amount": {"gte": 10000, "lt": 50000}},
        "steps": [
            {"approver_type": "role", "role": "retail_manager", "auto_approve_hours": 48}
        ]
    },
    {
        "name": "Multi-level approval",
        "condition": {"total_amount": {"gte": 50000, "lt": 200000}},
        "steps": [
            {"approver_type": "role", "role": "retail_manager"},
            {"approver_type": "role", "role": "retail_owner"}
        ]
    },
    {
        "name": "Executive approval",
        "condition": {"total_amount": {"gte": 200000}},
        "steps": [
            {"approver_type": "role", "role": "retail_manager"},
            {"approver_type": "role", "role": "retail_owner"},
            {"approver_type": "specific_user", "user_id": "finance_head_id"}
        ]
    }
]
```

---

## 4. Goods Receipt Flow

```mermaid
flowchart TD
    A[Delivery arrives at warehouse] --> B[Locate PO for delivery]
    B --> C[Open Goods Receipt screen]
    C --> D[Scan incoming items barcodes]
    D --> E{Match with PO items?}
    E --> |Match| F[Enter received quantities]
    E --> |No match| G[Flag discrepancy]
    F --> H{Batch/Expiry tracking?}
    H --> |Yes| I[Enter batch number & expiry]
    H --> |No| J[Skip]
    I --> K[Quality inspection]
    J --> K
    K --> L{Quality check}
    L --> |Pass| M[Accept items]
    L --> |Fail| N[Reject items with reason]
    M --> O[Select storage location]
    N --> P[Set aside for return]
    O --> Q[Confirm goods receipt]
    P --> Q
    Q --> R[Generate GRN number]
    R --> S[Auto-update inventory]
    S --> T[Update PO status]
    T --> U{Fully received?}
    U --> |Yes| V[PO status: Fully Received]
    U --> |No| W[PO status: Partially Received]
    V --> X[Trigger invoice matching]
    W --> Y[Await remaining delivery]
```

---

## 5. Three-Way Invoice Matching

```mermaid
flowchart TD
    A[Invoice received from supplier] --> B{OCR or Manual?}
    B --> |OCR| C[Upload invoice image]
    B --> |Manual| D[Enter invoice details]
    C --> E[OCR extracts line items]
    D --> F[Manual data entry]
    E --> G[Match with PO]
    F --> G
    G --> H[Match with GRN]
    H --> I{Three-way match}
    I --> |Full match| J[Auto-approve for payment]
    I --> |Minor variance < 2%| K[Auto-approve with note]
    I --> |Significant variance| L[Flag for review]
    L --> M{Manager review}
    M --> |Approve| J
    M --> |Reject| N[Return to supplier]
    J --> O[Schedule payment per terms]
    O --> P[Process payment]
```

---

## 6. Auto-Reorder Flow

```mermaid
flowchart TD
    A[Scheduled check every 6 hours] --> B[Scan all products per tenant]
    B --> C{Stock below reorder level?}
    C --> |No| D[Log: No action needed]
    C --> |Yes| E[Get AI demand forecast]
    E --> F[Calculate optimal reorder quantity]
    F --> G[Find best supplier via Recommendation Engine]
    G --> H[Generate reorder suggestion]
    H --> I{Auto-reorder enabled?}
    I --> |Yes| J{Amount below auto-approve threshold?}
    J --> |Yes| K[Auto-create & submit PO]
    J --> |No| L[Create PO draft, send for approval]
    I --> |No| M[Send notification to retailer]
    M --> N[Retailer reviews suggestion]
    N --> O{Accept?}
    O --> |Yes| K
    O --> |Modify| P[Edit suggestion, create PO]
    O --> |Dismiss| Q[Suggestion dismissed]
    K --> R[PO sent to supplier]
    R --> S[Audit log: Auto-reorder]
```

---

## 7. Supplier Return Flow

```mermaid
flowchart TD
    A[Identify items for return] --> B{Reason}
    B --> |Damaged on receipt| C
    B --> |Quality defect| C
    B --> |Wrong item| C
    B --> |Near expiry| C
    B --> |Excess stock| C
    C[Create return request] --> D[Select PO/GRN reference]
    D --> E[Add return items & quantities]
    E --> F[Upload evidence if applicable]
    F --> G[Submit return request]
    G --> H[Supplier notified]
    H --> I{Supplier response}
    I --> |Accept| J[Schedule pickup/drop-off]
    I --> |Reject| K[Escalate to admin]
    I --> |Partial accept| L[Negotiate quantities]
    J --> M[Items returned]
    M --> N[Credit note issued by supplier]
    N --> O[Update inventory: stock out]
    O --> P[Update credit account]
```
