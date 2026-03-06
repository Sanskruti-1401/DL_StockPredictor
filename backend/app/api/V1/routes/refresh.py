"""
On-demand data refresh routes using Polygon.io API.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from ....db.base import get_db
from ....db.models import Stock
from ....services.market_data import MarketDataService
from .auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/refresh", tags=["Data Refresh"])

# ==================== Request/Response Models ====================

class RefreshRequest(BaseModel):
    """Request model for refresh operations."""
    symbols: Optional[List[str]] = None  # If None, refresh all stocks
    days: int = 365  # Historical days to fetch


class RefreshResponse(BaseModel):
    """Response model for refresh operations."""
    total: int
    synced: int
    failed: int
    records_created: int
    errors: List[str]
    started_at: str
    completed_at: str


class QuickRefreshResponse(BaseModel):
    """Response model for quick price refresh."""
    total: int
    updated: int
    failed: int
    updated_at: str


class PolygonAPIEndpoints(BaseModel):
    """Documentation of Polygon.io API endpoints."""
    price_history: str = "GET /v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}"
    latest_quote: str = "GET /v2/aggs/ticker/{symbol}/prev"
    ticker_details: str = "GET /v3/reference/tickers/{symbol}"
    description: str = "All endpoints require apiKey parameter"


# ==================== Endpoints ====================

@router.post("/full-sync", response_model=RefreshResponse)
async def full_sync_market_data(
    request: RefreshRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Full on-demand refresh of market data from Polygon.io.
    
    **Polygon Integration**:
    - Fetches historical price data: `GET /v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}`
    - Stores in database with OHLCV fields
    - Creates/updates PriceHistory records
    
    **Parameters**:
    - symbols: List of stock symbols. If None, refreshes all stocks in database
    - days: Number of historical days to fetch (default: 365)
    
    **Flow**:
    1. Get list of stocks to sync
    2. For each stock, call Polygon API for daily aggregates
    3. Parse OHLCV data and store in PriceHistory table
    4. Return sync statistics
    """
    try:
        # Get symbols to refresh
        if request.symbols:
            symbols = request.symbols
        else:
            # Get all active stocks from database
            stocks = db.query(Stock).filter(Stock.active == True).all()
            symbols = [s.symbol for s in stocks]
        
        if not symbols:
            raise HTTPException(status_code=400, detail="No stocks to refresh")
        
        logger.info(f"Starting full sync for {len(symbols)} stocks")
        
        # Initialize market data service
        market_service = MarketDataService(db)
        
        # Perform sync
        stats = market_service.sync_market_data(symbols, days=request.days)
        
        return RefreshResponse(
            total=stats["total"],
            synced=stats["synced"],
            failed=stats["failed"],
            records_created=stats.get("records_created", 0),
            errors=stats["errors"],
            started_at=stats["started_at"],
            completed_at=stats.get("completed_at", ""),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in full sync: {e}")
        raise HTTPException(status_code=500, detail=f"Error syncing market data: {str(e)}")


@router.post("/quick-refresh", response_model=QuickRefreshResponse)
async def quick_refresh_latest_prices(
    symbols: List[str] = Query(..., description="Stock symbols to refresh"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Quick refresh of latest prices for specific stocks.
    
    **Polygon Integration**:
    - Fetches latest quote: `GET /v2/aggs/ticker/{symbol}/prev`
    - Updates only the most recent price
    
    **Performance**:
    - Lightweight operation
    - ~100ms per stock
    - Ideal for dashboard updates
    
    **Flow**:
    1. For each symbol, query Polygon for previous close
    2. Update PriceHistory with latest bar
    3. Return quotes and stats
    """
    try:
        if not symbols:
            raise HTTPException(status_code=400, detail="No symbols provided")
        
        logger.info(f"Quick refresh for {len(symbols)} symbols")
        
        market_service = MarketDataService(db)
        stats = market_service.refresh_latest_prices(symbols)
        
        return QuickRefreshResponse(
            total=stats["total"],
            updated=stats["updated"],
            failed=stats["failed"],
            updated_at=stats["updated_at"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in quick refresh: {e}")
        raise HTTPException(status_code=500, detail=f"Error refreshing prices: {str(e)}")


@router.post("/refresh/{stock_id}")
async def refresh_single_stock(
    stock_id: int,
    days: int = Query(365, ge=1, le=1825, description="Days of history"),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Refresh data for a single stock.
    
    **Polygon Integration**:
    - Daily aggregate bars: `GET /v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}`
    - Ticker details: `GET /v3/reference/tickers/{symbol}`
    
    **Parameters**:
    - stock_id: Database stock ID
    - days: Historical days to fetch
    """
    try:
        stock = db.query(Stock).filter(Stock.id == stock_id).first()
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found")
        
        logger.info(f"Refreshing single stock: {stock.symbol}")
        
        market_service = MarketDataService(db)
        stats = market_service.sync_market_data([stock.symbol], days=days)
        
        return {
            "symbol": stock.symbol,
            "total": stats["total"],
            "synced": stats["synced"],
            "failed": stats["failed"],
            "records_created": stats.get("records_created", 0),
            "errors": stats["errors"],
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error refreshing stock {stock_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error refreshing stock: {str(e)}")


@router.get("/api-endpoints", response_model=PolygonAPIEndpoints)
async def get_polygon_endpoints():
    """
    Get documentation of Polygon.io endpoints used by this service.
    
    **Endpoints**:
    1. **Price History** (Aggregates):
       - `GET /v2/aggs/ticker/{symbol}/range/{multiplier}/{timespan}/{from}/{to}`
       - Returns: OHLCV bars for specified date range
       - Used for: Historical price data sync
    
    2. **Latest Quote** (Previous Close):
       - `GET /v2/aggs/ticker/{symbol}/prev`
       - Returns: Most recent trading day OHLCV
       - Used for: Real-time price updates
    
    3. **Ticker Details**:
       - `GET /v3/reference/tickers/{symbol}`
       - Returns: Company info, active status, type
       - Used for: Stock metadata
    
    **Rate Limits**:
    - Free tier: 5 requests/minute
    - Premium tiers: Higher limits
    
    **Authentication**:
    - All requests require `apiKey` query parameter
    """
    return PolygonAPIEndpoints()
