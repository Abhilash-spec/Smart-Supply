import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.inventory_service import inventory_service

router = APIRouter()

class InventoryItemResponse(BaseModel):
    id: str
    name: str
    stock: int
    status: str

class StockAdjustment(BaseModel):
    quantity: int
    reason: str

@router.get("/", response_model=List[InventoryItemResponse])
async def list_inventory(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    List all inventory items for the authenticated tenant.
    """
    tenant_id = request.state.tenant_id
    if not tenant_id:
        # In a real app, fallback to global tenant or raise 403
        tenant_id = uuid.uuid4()
        
    items = await inventory_service.get_inventory_items(db, tenant_id, skip, limit)
    return items

@router.post("/{item_id}/adjust")
async def adjust_stock(
    item_id: uuid.UUID,
    adjustment: StockAdjustment,
    db: AsyncSession = Depends(get_db)
):
    """
    Manually adjust stock for a specific item (e.g., shrinkage, damage).
    """
    result = await inventory_service.adjust_stock(db, item_id, adjustment.quantity, adjustment.reason)
    return result
