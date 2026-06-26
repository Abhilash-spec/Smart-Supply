import { z } from "zod"

// ──────────────────────────────────────────
// POS / Checkout
// ──────────────────────────────────────────

export const CartItemSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
  name: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  selling_price: z.number().positive("Price must be positive"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10000, "Quantity too large"),
})

export const CheckoutSchema = z.object({
  cartItems: z.array(CartItemSchema).min(1, "Cart cannot be empty").max(200, "Too many items"),
  paymentMethod: z.enum(["cash", "card", "upi", "credit"]),
  customerId: z.string().uuid().optional(),
})

// ──────────────────────────────────────────
// Staff Management
// ──────────────────────────────────────────

export const CreateStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  staffType: z.enum(["shop", "vendor"]),
  permissions: z.any(), // Flexible JSON permissions object
})

export const UpdateStaffSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName: z.string().min(1).max(100).trim(),
  status: z.enum(["active", "inactive"]).optional(),
})

// ──────────────────────────────────────────
// Vendor Catalog
// ──────────────────────────────────────────

export const AddCatalogItemSchema = z.object({
  name: z.string().min(1, "Product name is required").max(255),
  sku: z.string().min(1, "SKU is required").max(100),
  price: z.number().positive("Price must be positive"),
})

export const UpdateCatalogItemSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().min(1).max(100),
  price: z.number().positive(),
})

// ──────────────────────────────────────────
// Procurement / Purchase Orders
// ──────────────────────────────────────────

export const PurchaseOrderItemSchema = z.object({
  id: z.string().uuid("Invalid product ID"),
  name: z.string().min(1).max(255),
  price: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(100000),
  supplierId: z.string().uuid().optional(),
})

export const CreatePurchaseOrderSchema = z.array(PurchaseOrderItemSchema)
  .min(1, "Purchase order must have at least one item")
  .max(500, "Too many items in a single PO")

// ──────────────────────────────────────────
// Billing / Subscription
// ──────────────────────────────────────────

export const ProcessSubscriptionSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
  billingCycle: z.enum(["monthly", "yearly"]),
  gateway: z.string().max(50).default("simulated_internal"),
})

// ──────────────────────────────────────────
// Inventory / Batch
// ──────────────────────────────────────────

export const AddBatchSchema = z.object({
  batchNumber: z.string().min(1).max(100),
  mfgDate: z.string().max(50),
  expDate: z.string().max(50),
  quantity: z.number().int().min(1).max(1000000),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
})

// ──────────────────────────────────────────
// Common Validators
// ──────────────────────────────────────────

export const UUIDParam = z.string().uuid("Invalid ID format")

export const TenantStatusSchema = z.enum(["active", "suspended"])

export const POStatusSchema = z.enum([
  "draft", "pending_approval", "approved", "rejected", 
  "sent", "acknowledged", "partially_received", "fully_received", "closed", "cancelled"
])
