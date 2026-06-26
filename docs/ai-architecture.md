# SmartSupply AI — AI Architecture

### Version: 1.0
### Last Updated: 2026-06-16

---

# 1. AI System Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                      AI PLATFORM LAYER                            │
│                                                                   │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Demand      │  │   Supplier    │  │  Inventory    │       │
│  │  Forecasting  │  │ Recommendation│  │ Optimization  │       │
│  │   Engine      │  │   Engine      │  │   Engine      │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                 │
│  ┌───────┴──────────────────┴──────────────────┴───────┐       │
│  │              ML Pipeline & Feature Store             │       │
│  └───────┬─────────────────────────────────────────────┘       │
│          │                                                      │
│  ┌───────┴───────────────────────────────────────────┐         │
│  │                AI Copilot Layer                     │         │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐ │         │
│  │  │  Chat  │  │ Voice  │  │WhatsApp│  │  OCR   │ │         │
│  │  │Assistant│  │Assistant│  │  Bot   │  │ Engine │ │         │
│  │  └────────┘  └────────┘  └────────┘  └────────┘ │         │
│  │                                                    │         │
│  │  ┌────────────────────────────────────────────┐   │         │
│  │  │    RAG Engine (pgvector + OpenAI/Llama)    │   │         │
│  │  └────────────────────────────────────────────┘   │         │
│  └───────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────────┘
```

---

# 2. Demand Forecasting Engine

## 2.1 Architecture

```
Data Sources → Feature Engineering → Model Training → Prediction → Post-Processing → Storage → Actions
```

## 2.2 Data Sources

| Source | Data | Refresh |
|--------|------|---------|
| Sales History | Daily/weekly/monthly sales per product | Real-time |
| Inventory Levels | Current stock, movements | Real-time |
| Purchase Orders | Order history, lead times | Real-time |
| Calendar | Holidays, festivals, events | Pre-loaded |
| Product Metadata | Category, brand, price, shelf life | On change |
| Supplier Data | Lead times, reliability scores | Daily |

## 2.3 Feature Engineering

```python
class FeatureEngineer:
    """Generates ML features for demand forecasting."""

    def generate_features(self, product_id: str, date: date) -> dict:
        return {
            # Sales features
            "sales_7d": self.rolling_sales(product_id, days=7),
            "sales_14d": self.rolling_sales(product_id, days=14),
            "sales_30d": self.rolling_sales(product_id, days=30),
            "sales_90d": self.rolling_sales(product_id, days=90),
            "sales_trend_7d": self.sales_trend(product_id, days=7),
            "sales_velocity": self.sales_velocity(product_id),
            "sales_volatility": self.sales_std(product_id, days=30),

            # Temporal features
            "day_of_week": date.weekday(),
            "day_of_month": date.day,
            "month": date.month,
            "quarter": (date.month - 1) // 3 + 1,
            "is_weekend": 1 if date.weekday() >= 5 else 0,
            "is_month_start": 1 if date.day <= 5 else 0,
            "is_month_end": 1 if date.day >= 25 else 0,

            # Holiday features
            "is_holiday": self.is_holiday(date),
            "days_to_next_holiday": self.days_to_next_holiday(date),
            "is_festival_season": self.is_festival_season(date),

            # Inventory features
            "current_stock": self.current_stock(product_id),
            "days_of_stock": self.days_of_stock(product_id),
            "stockout_count_30d": self.stockout_count(product_id, days=30),

            # Product features
            "category_encoded": self.encode_category(product_id),
            "price": self.get_price(product_id),
            "price_change_30d": self.price_change(product_id, days=30),
            "product_age_days": self.product_age(product_id),
        }
```

## 2.4 Models

### Model 1: XGBoost (Primary)
- **Use Case**: Short-term demand (7-30 days)
- **Training**: Weekly retrain per tenant
- **Features**: All engineered features
- **Output**: Point prediction + SHAP explanations

### Model 2: Prophet (Seasonal)
- **Use Case**: Seasonal patterns, trend decomposition
- **Training**: Monthly retrain
- **Features**: Time series data
- **Output**: Trend, seasonality, holiday effects

### Model 3: LSTM (Long-term)
- **Use Case**: Long-term patterns (60-90 days)
- **Training**: Monthly retrain
- **Features**: Sequence of daily sales
- **Output**: Sequence prediction

### Ensemble Strategy
```python
def ensemble_predict(product_id: str, horizon_days: int) -> Prediction:
    xgb_pred = xgboost_model.predict(product_id, horizon_days)
    prophet_pred = prophet_model.predict(product_id, horizon_days)
    lstm_pred = lstm_model.predict(product_id, horizon_days)

    # Weighted ensemble based on recent accuracy
    weights = get_model_weights(product_id)  # Dynamic weights

    final_prediction = (
        weights["xgboost"] * xgb_pred +
        weights["prophet"] * prophet_pred +
        weights["lstm"] * lstm_pred
    )

    confidence_interval = calculate_confidence(
        predictions=[xgb_pred, prophet_pred, lstm_pred],
        weights=weights,
        confidence_level=0.95
    )

    return Prediction(
        value=final_prediction,
        lower=confidence_interval.lower,
        upper=confidence_interval.upper,
        model_contributions={
            "xgboost": weights["xgboost"],
            "prophet": weights["prophet"],
            "lstm": weights["lstm"]
        }
    )
```

## 2.5 Training Pipeline

```
┌──────────┐    ┌────────────┐    ┌──────────┐    ┌──────────┐
│  Data    │───>│  Feature   │───>│  Model   │───>│  Model   │
│ Extract  │    │ Engineering│    │ Training │    │ Registry │
└──────────┘    └────────────┘    └──────────┘    └──────────┘
                                       │                │
                                       ▼                ▼
                                  ┌──────────┐    ┌──────────┐
                                  │ Validation│    │Production│
                                  │  Metrics  │    │  Deploy  │
                                  └──────────┘    └──────────┘
```

**Schedule**: 
- XGBoost: Weekly (Saturday midnight)
- Prophet: Monthly (1st of month)
- LSTM: Monthly (1st of month)

## 2.6 Accuracy Monitoring

| Metric | Target | Alert Threshold |
|--------|--------|:--------------:|
| MAPE | < 15% | > 25% |
| RMSE | < 20% of mean | > 35% |
| Bias | ±5% | > ±15% |
| Coverage (95% CI) | > 90% | < 80% |

---

# 3. Supplier Recommendation Engine

## 3.1 Scoring Algorithm

```python
def rank_suppliers(product_id: str, quantity: int) -> list[SupplierScore]:
    suppliers = find_suppliers_for_product(product_id)
    scores = []

    for supplier in suppliers:
        # Price Score (0-30 points)
        price_score = calculate_price_score(
            supplier_price=supplier.price,
            quantity=quantity,
            market_avg=get_market_avg_price(product_id),
            bulk_discounts=supplier.bulk_pricing
        )

        # Delivery Score (0-25 points)
        delivery_score = calculate_delivery_score(
            avg_delivery_days=supplier.avg_delivery_days,
            on_time_rate=supplier.on_time_delivery_rate,
            in_delivery_zone=supplier.delivers_to(buyer_location)
        )

        # Quality Score (0-20 points)
        quality_score = calculate_quality_score(
            avg_rating=supplier.avg_rating,
            total_ratings=supplier.total_ratings,
            return_rate=supplier.return_rate,
            quality_rating=supplier.quality_rating
        )

        # Reliability Score (0-15 points)
        reliability_score = calculate_reliability_score(
            fulfillment_rate=supplier.fulfillment_rate,
            cancellation_rate=supplier.cancellation_rate,
            response_time_hours=supplier.avg_response_time,
            years_on_platform=supplier.tenure_years
        )

        # Availability Score (0-10 points)
        availability_score = calculate_availability_score(
            in_stock=supplier.has_stock(product_id),
            stock_quantity=supplier.stock_quantity(product_id),
            requested_quantity=quantity
        )

        total = price_score + delivery_score + quality_score + reliability_score + availability_score

        scores.append(SupplierScore(
            supplier_id=supplier.id,
            total_score=total,
            breakdown={
                "price": price_score,
                "delivery": delivery_score,
                "quality": quality_score,
                "reliability": reliability_score,
                "availability": availability_score
            },
            recommendation_reason=generate_reason(total, supplier)
        ))

    return sorted(scores, key=lambda s: s.total_score, reverse=True)
```

---

# 4. Inventory Optimization Engine

## 4.1 Capabilities

### Overstock Detection
```python
def detect_overstock(product_id: str) -> OverstockAlert:
    current_stock = get_current_stock(product_id)
    avg_daily_sales = get_avg_daily_sales(product_id, days=30)
    days_of_stock = current_stock / max(avg_daily_sales, 0.01)

    if days_of_stock > 90:
        excess_quantity = current_stock - (avg_daily_sales * 60)
        excess_value = excess_quantity * get_cost_price(product_id)
        return OverstockAlert(
            product_id=product_id,
            severity="high" if days_of_stock > 180 else "medium",
            days_of_stock=days_of_stock,
            excess_quantity=excess_quantity,
            excess_value=excess_value,
            suggestions=[
                "Consider running a promotion",
                "Reduce reorder quantity",
                "Return to supplier if possible"
            ]
        )
```

### Stockout Prediction
```python
def predict_stockout(product_id: str) -> StockoutPrediction:
    current_stock = get_current_stock(product_id)
    predicted_daily_demand = get_forecast(product_id, horizon=30)
    incoming_stock = get_incoming_stock(product_id)

    projected_stock = current_stock + incoming_stock
    days_until_stockout = 0

    for day in range(30):
        projected_stock -= predicted_daily_demand[day]
        if projected_stock <= 0:
            days_until_stockout = day
            break

    if days_until_stockout > 0 and days_until_stockout <= 14:
        return StockoutPrediction(
            product_id=product_id,
            days_until_stockout=days_until_stockout,
            estimated_lost_sales=calculate_lost_sales(product_id, days=7),
            recommended_action="reorder",
            suggested_reorder_qty=calculate_eoq(product_id)
        )
```

### ABC-XYZ Analysis
```python
def abc_xyz_classification(tenant_id: str) -> dict:
    """
    ABC: Revenue contribution (A=80%, B=15%, C=5%)
    XYZ: Demand variability (X=stable, Y=moderate, Z=volatile)
    """
    products = get_all_products(tenant_id)

    # ABC Classification
    products.sort(key=lambda p: p.revenue_contribution, reverse=True)
    cumulative = 0
    for product in products:
        cumulative += product.revenue_contribution
        if cumulative <= 0.80:
            product.abc_class = "A"
        elif cumulative <= 0.95:
            product.abc_class = "B"
        else:
            product.abc_class = "C"

    # XYZ Classification
    for product in products:
        cv = product.demand_coefficient_of_variation
        if cv < 0.3:
            product.xyz_class = "X"
        elif cv < 0.6:
            product.xyz_class = "Y"
        else:
            product.xyz_class = "Z"

    return categorize_matrix(products)
```

---

# 5. AI Copilot Architecture

## 5.1 RAG Pipeline

```
User Query
    │
    ▼
┌──────────────┐
│ Intent       │ ← Classify: inventory, procurement, analytics, supplier, general
│ Detection    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Context      │ ← Query pgvector for relevant documents
│ Retrieval    │ ← Fetch real-time data (stock, orders, etc.)
│ (RAG)        │ ← Include user's tenant context
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Prompt       │ ← System prompt + context + user query
│ Assembly     │ ← Role-based permissions in prompt
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ LLM          │ ← OpenAI GPT-4o (primary)
│ Generation   │ ← Llama 3 (fallback / self-hosted)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Response     │ ← Extract actionable items
│ Processing   │ ← Format data tables
│              │ ← Generate charts if needed
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Action       │ ← "Create PO" → PO creation flow
│ Execution    │ ← "Show chart" → Chart rendering
│ (optional)   │ ← "Alert me" → Notification setup
└──────────────┘
```

## 5.2 System Prompt

```
You are SmartSupply AI Copilot, an intelligent assistant for retail supply chain management.

Context:
- Tenant: {tenant_name}
- User: {user_name} ({user_role})
- Organization: {org_name} ({org_type})
- Current Plan: {subscription_plan}

You help with:
1. Inventory questions (stock levels, movements, expiry)
2. Procurement guidance (supplier selection, pricing, reorders)
3. Analytics insights (sales trends, inventory health)
4. Supplier information (ratings, delivery performance)

Rules:
- Only access data within the user's tenant and permissions
- Never reveal data from other tenants
- When suggesting actions, provide confirmation before executing
- Present numerical data in tables when possible
- Use ₹ for currency (INR)
- Be concise but thorough
- If unsure, say so rather than guessing
```

## 5.3 Context Sources for RAG

| Source | Embedding Model | Update Frequency | Chunk Strategy |
|--------|----------------|-----------------|----------------|
| Product Catalog | text-embedding-3-small | Nightly batch | Per-product |
| Supplier Profiles | text-embedding-3-small | Nightly batch | Per-supplier |
| Help Documentation | text-embedding-3-small | On change | Per-section |
| Past Conversations | text-embedding-3-small | Per conversation | Per-message |
| Inventory Reports | — | Real-time API | Not embedded |
| Order Data | — | Real-time API | Not embedded |

## 5.4 Example Interactions

**Inventory Query:**
> User: "What's my stock for Parle-G?"
> Copilot: "You have 45 units of Parle-G (SKU: FMCG-PG-001) across your locations:
> | Location | Quantity | Status |
> |----------|----------|--------|
> | Main Store | 30 | Normal |
> | Warehouse A | 15 | Low (reorder level: 20) |
> 
> ⚠️ Warehouse A is below reorder level. Would you like me to create a purchase order?"

**Procurement Query:**
> User: "Who's the cheapest supplier for basmati rice?"
> Copilot: "Here are the top suppliers for Basmati Rice (1kg):
> | Supplier | Price | Rating | Delivery |
> |----------|-------|--------|----------|
> | Gupta Trading | ₹85/kg | 4.5⭐ | 2 days |
> | Maharashtra Foods | ₹88/kg | 4.2⭐ | 3 days |
> | Sharma Distributors | ₹90/kg | 4.8⭐ | 1 day |
> 
> 💡 Gupta Trading offers the best price, but Sharma Distributors has the best rating and fastest delivery."

---

# 6. OCR Invoice Processing

## 6.1 Pipeline

```
Invoice Image/PDF → Pre-processing → OCR Engine → Text Extraction
    → NLP Entity Recognition → Structured Data → PO Matching → Review → GRN
```

## 6.2 Extracted Fields

| Field | Extraction Method |
|-------|------------------|
| Invoice Number | Regex + NLP |
| Invoice Date | Date parser |
| Supplier Name | NER + fuzzy match |
| GSTIN | Regex (15-char pattern) |
| Line Items | Table detection + row parsing |
| Product Names | NLP + catalog matching |
| Quantities | Numeric extraction |
| Unit Prices | Currency parsing |
| Tax Details | GST pattern matching |
| Total Amount | Sum validation |

## 6.3 Technology
- **Primary**: Google Cloud Vision API / AWS Textract
- **Fallback**: Tesseract OCR (self-hosted)
- **NLP**: spaCy + custom NER model for Indian invoices

---

# 7. Product Image Recognition

## 7.1 Use Cases
1. **Product Identification**: Upload product photo → identify product in catalog
2. **Shelf Scanning**: Capture shelf image → count products → compare with system stock
3. **Label Reading**: Extract product info from packaging labels

## 7.2 Technology
- **Model**: CLIP (Contrastive Language-Image Pre-Training)
- **Custom Training**: Fine-tuned on Indian retail product images
- **Deployment**: TensorFlow Serving / ONNX Runtime

---

# 8. WhatsApp Assistant

## 8.1 Architecture

```
WhatsApp → WhatsApp Business API → Webhook → Message Router
    │
    ├── Text Message → NLP Intent Detection → Copilot Engine → Response
    ├── Image → OCR Pipeline → Invoice Processing → Confirmation
    ├── Voice Note → Speech-to-Text → NLP → Copilot Engine → Response
    └── Quick Reply → Action Handler → Business Logic → Response
```

## 8.2 Supported Commands

| Command | Example | Action |
|---------|---------|--------|
| Stock Check | "Stock of Parle-G" | Returns current stock |
| Place Order | "Order 100 units of rice from Gupta Trading" | Initiates PO |
| Low Stock | "What's running low?" | Lists low stock items |
| Sales Today | "Today's sales" | Returns daily summary |
| Track Order | "Track PO-2026-001" | Returns PO status |

---

# 9. Model Serving Infrastructure

```
┌──────────────────────────────────────────────────────────────┐
│                    Model Serving Layer                         │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ XGBoost      │  │ Prophet      │  │ LSTM         │      │
│  │ (CPU)        │  │ (CPU)        │  │ (GPU opt.)   │      │
│  │ FastAPI      │  │ FastAPI      │  │ FastAPI      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │ OpenAI API   │  │ Llama 3      │                         │
│  │ (External)   │  │ (Self-hosted │                         │
│  │              │  │  vLLM/Ollama)│                         │
│  └──────────────┘  └──────────────┘                         │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │           Model Registry & Versioning             │       │
│  │           (MLflow / Custom)                       │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

---

# 10. AI Cost Management

| Component | Cost Driver | Optimization |
|-----------|-----------|-------------|
| OpenAI API | Token usage | Cache frequent queries, limit context window |
| Embeddings | Vector count | Batch updates, incremental only |
| Training | Compute hours | Scheduled off-peak, spot instances |
| Llama (self-hosted) | GPU instances | Auto-scaling, shared across tenants |
| OCR | API calls | Client-side pre-validation |

**Monthly Cost Estimate (10,000 tenants)**:
- OpenAI API: $2,000-5,000
- Compute (training): $500-1,000
- GPU (Llama): $1,000-2,000
- Vector DB: Included in Supabase
- **Total AI Cost**: $3,500-8,000/month
