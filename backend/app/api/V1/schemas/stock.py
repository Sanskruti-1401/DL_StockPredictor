"""
Stock-related request/response schemas.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class PriceHistorySchema(BaseModel):
    """Historical price data."""
    date: datetime
    open_price: float
    high_price: float
    low_price: float
    close_price: float
    volume: Optional[int] = None
    adjusted_close: Optional[float] = None
    
    class Config:
        from_attributes = True


class PerformanceMetricsSchema(BaseModel):
    """Stock performance metrics."""
    return_1_month: Optional[float] = None
    return_3_month: Optional[float] = None
    return_6_month: Optional[float] = None
    return_1_year: Optional[float] = None
    volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    
    class Config:
        from_attributes = True


class StockSchema(BaseModel):
    """Stock information schema."""
    id: int
    symbol: str = Field(..., description="Stock ticker symbol")
    name: str = Field(..., description="Company name")
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = Field(None, description="Market capitalization")
    pe_ratio: Optional[float] = Field(None, description="Price-to-Earnings ratio")
    dividend_yield: Optional[float] = Field(None, description="Dividend yield %")
    beta: Optional[float] = Field(None, description="Beta coefficient")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class StockDetailSchema(StockSchema):
    """Detailed stock information with additional data."""
    current_price: float = Field(..., description="Current stock price")
    price_change: float = Field(..., description="Price change in currency")
    price_change_percent: float = Field(..., description="Price change %")
    fifty_two_week_high: float = Field(..., description="52-week high price")
    fifty_two_week_low: float = Field(..., description="52-week low price")
    average_volume: Optional[float] = None
    latest_prediction: Optional[dict] = None  # Latest prediction for this stock
    latest_news: Optional[list[dict]] = None  # Recent news articles
    risk_level: Optional[str] = None
    
    class Config:
        from_attributes = True


class StockCreateSchema(BaseModel):
    """Schema for adding a new stock."""
    symbol: str = Field(..., min_length=1, max_length=10, description="Stock ticker symbol")
    name: str = Field(..., description="Company name")
    sector: Optional[str] = None
    industry: Optional[str] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None


class StockUpdateSchema(BaseModel):
    """Schema for updating stock information."""
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    beta: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None


class StockListSchema(BaseModel):
    """Stock list response with pagination."""
    total: int = Field(..., description="Total number of stocks")
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)
    stocks: list[StockSchema]
    
    class Config:
        from_attributes = True


class StockComparisionSchema(BaseModel):
    """Compare multiple stocks."""
    symbols: list[str]
    metrics: PerformanceMetricsSchema
    stocks: list[StockDetailSchema]
    
    class Config:
        from_attributes = True


class WatchlistSchema(BaseModel):
    """User watchlist of stocks."""
    id: int
    user_id: int
    stocks: list[StockDetailSchema]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class StockScreenerSchema(BaseModel):
    """Stock screener filters."""
    min_market_cap: Optional[float] = None
    max_market_cap: Optional[float] = None
    min_pe_ratio: Optional[float] = None
    max_pe_ratio: Optional[float] = None
    min_dividend_yield: Optional[float] = None
    sectors: Optional[list[str]] = None
    risk_levels: Optional[list[str]] = None
    recommendation: Optional[str] = Field(None, description="BUY, SELL, or HOLD")
