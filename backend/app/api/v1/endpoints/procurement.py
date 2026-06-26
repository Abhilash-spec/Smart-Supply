import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.procurement_service import procurement_service

router = APIRouter()

class POCreateItem(BaseModel):
    product_id: str
    quantity: int
    unit_price: float

class POCreate(BaseModel):
    supplier_id: str
    items: List[POCreateItem]

@router.post("/purchase-orders", status_code=201)
async def create_purchase_order(
    request: Request,
    po: POCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new Purchase Order for the tenant.
    """
    tenant_id = getattr(request.state, "tenant_id", uuid.uuid4())
    
    result = await procurement_service.create_purchase_order(
        db=db,
        tenant_id=tenant_id,
        supplier_id=uuid.UUID(po.supplier_id),
        items=[item.model_dump() for item in po.items]
    )
    return result

@router.post("/purchase-orders/{po_id}/approve")
async def approve_purchase_order(
    request: Request,
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Approve a pending Purchase Order.
    Requires manager or owner permissions depending on amount.
    """
    # In reality, get user_id from auth token via request.state
    approver_id = uuid.uuid4()
    
    result = await procurement_service.approve_purchase_order(db, po_id, approver_id)
    return result
