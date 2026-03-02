"""
Risk assessment-related request/response schemas.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class RiskMetricSchema(BaseModel):
    """Risk metrics for a stock."""
    id: int
    stock_id: int
    date: datetime
    volatility: float = Field(..., ge=0, description="Standard deviation")
    beta: Optional[float] = Field(None, description="Market beta coefficient")
    value_at_risk: Optional[float] = Field(None, description="VaR at 95% confidence")
    max_drawdown: Optional[float] = Field(None, description="Maximum drawdown from peak")
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    return_1_month: Optional[float] = None
    return_3_month: Optional[float] = None
    return_6_month: Optional[float] = None
    return_1_year: Optional[float] = None
    risk_level: str = Field(..., description="LOW, MEDIUM, HIGH, VERY_HIGH")
    risk_score: float = Field(..., ge=0, le=100, description="Risk score 0-100")
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RiskDashboardSchema(BaseModel):
    """Risk dashboard overview."""
    stock_symbol: str
    current_price: float
    risk_level: str
    risk_score: float
    key_metrics: dict = Field(..., description="Risk metrics overview")
    alerts: Optional[list[str]] = None  # Risk alerts
    recommendations: Optional[list[str]] = None  # Risk mitigation recommendations
    
    class Config:
        from_attributes = True


class RiskAnalysisSchema(BaseModel):
    """Detailed risk analysis."""
    stock_symbol: str
    analysis_date: datetime
    volatility_analysis: dict = Field(..., description="Volatility metrics and trends")
    correlation_analysis: dict = Field(..., description="Market correlation")
    portfolio_impact: Optional[dict] = None  # Impact on portfolio
    scenario_analysis: Optional[dict] = None  # Stress testing results
    value_at_risk_analysis: Optional[dict] = None  # VaR analysis at different confidence levels
    
    class Config:
        from_attributes = True


class PortfolioRiskSchema(BaseModel):
    """Portfolio risk assessment."""
    portfolio_id: int
    total_value: float
    portfolio_volatility: float
    portfolio_beta: float
    portfolio_var: float
    concentration_risk: float = Field(..., ge=0, le=1, description="Concentration risk 0-1")
    correlation_matrix: Optional[dict] = None
    diversification_ratio: Optional[float] = None
    asset_allocation: dict = Field(..., description="Asset allocation by type")
    risk_level: str
    risk_score: float
    recommendations: list[str]
    
    class Config:
        from_attributes = True


class RiskComparisonSchema(BaseModel):
    """Compare risk metrics across stocks."""
    stocks: list[dict] = Field(..., description="Stock risk comparison data")
    peer_average: dict = Field(..., description="Peer group average metrics")
    market_average: dict = Field(..., description="Market average metrics")
    outliers: Optional[list[str]] = None  # High risk outliers
    
    class Config:
        from_attributes = True


class StressTestSchema(BaseModel):
    """Stress test simulation."""
    stock_symbol: str
    base_scenario: dict = Field(..., description="Base case scenario")
    bull_case: dict = Field(..., description="Bull case scenario (+20%)")
    bear_case: dict = Field(..., description="Bear case scenario (-20%)")
    extreme_case: dict = Field(..., description="Extreme case scenario (-40%)")
    
    class Config:
        from_attributes = True


class RiskHistorySchema(BaseModel):
    """Historical risk metrics."""
    stock_symbol: str
    period: str = Field(..., description="1M, 3M, 6M, 1Y")
    risk_metrics_history: list[RiskMetricSchema]
    risk_trend: str = Field(..., description="INCREASING, DECREASING, STABLE")
    
    class Config:
        from_attributes = True


class RiskAlertSchema(BaseModel):
    """Risk alert notification."""
    id: int
    stock_symbol: str
    alert_type: str = Field(..., description="HIGH_VOLATILITY, HIGH_CORRELATION, LARGE_DRAWDOWN, etc.")
    severity: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    message: str
    threshold: Optional[float] = None
    current_value: Optional[float] = None
    triggered_at: datetime
    
    class Config:
        from_attributes = True
