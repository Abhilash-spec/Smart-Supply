"""
SmartSupply AI — FastAPI Middleware

Custom middleware for tenant resolution, request tracing, and audit logging.
"""

import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
import structlog

logger = structlog.get_logger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Adds a unique request ID to each incoming request."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        request.state.request_id = request_id
        
        # Bind request_id to structured logger
        structlog.contextvars.bind_contextvars(request_id=request_id)
        
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        return response


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Extracts the tenant ID from the request and attaches it to the state.
    Looks in headers (X-Tenant-ID) or decoded JWT token.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Try to get tenant from custom header (e.g. API keys or admin overriding)
        tenant_id_str = request.headers.get("X-Tenant-ID")
        
        # 2. Try to get tenant from domain (e.g. tenant.smartsupply.ai)
        host = request.headers.get("Host", "")
        
        # In a real app, you would resolve host or JWT to tenant_id here
        # For now, we just attach what we find or None
        if tenant_id_str:
            try:
                request.state.tenant_id = uuid.UUID(tenant_id_str)
                structlog.contextvars.bind_contextvars(tenant_id=tenant_id_str)
            except ValueError:
                request.state.tenant_id = None
        else:
            request.state.tenant_id = None

        response = await call_next(request)
        return response


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware to catch potentially mutating requests and trigger audit events.
    (Actual deep auditing should happen in the service layer or SQLAlchemy events)
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Log basic HTTP info for mutating requests
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            logger.info(
                "http_mutation_request",
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                client_ip=request.client.host if request.client else None,
                tenant_id=getattr(request.state, "tenant_id", None)
            )
            
        return response
