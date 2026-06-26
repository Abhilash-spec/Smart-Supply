"""
SmartSupply AI — Main API Router

Aggregates all domain routers into a single v1 API router.
"""

from fastapi import APIRouter

# Import domain routers (placeholders for scaffolding)
# from app.api.v1.endpoints import auth, tenants, users, products, inventory, orders, etc.

api_router = APIRouter()

# Example router inclusions:
# api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# api_router.include_router(tenants.router, prefix="/tenants", tags=["Tenants"])
# api_router.include_router(users.router, prefix="/users", tags=["Users"])
# api_router.include_router(products.router, prefix="/products", tags=["Product Catalog"])
# api_router.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
# api_router.include_router(procurement.router, prefix="/procurement", tags=["Procurement"])
# api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
# api_router.include_router(marketplace.router, prefix="/marketplace", tags=["Marketplace"])
# api_router.include_router(ai.router, prefix="/ai", tags=["AI & Forecasting"])

# A temporary health endpoint for the router itself
@api_router.get("/status")
async def api_status():
    return {"status": "v1 api active"}
