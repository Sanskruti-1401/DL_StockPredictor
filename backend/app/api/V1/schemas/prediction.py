"""
Prediction-related request/response schemas.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TechnicalIndicatorsSchema(BaseModel):
    """Technical indicators data."""
    rsi: Optional[float] = Field(None, ge=0, le=100, description="Relative Strength Index")
    macd: Optional[float] = None
    bollinger_bands_signal: Optional[str] = None
    moving_average_50: Optional[float] = None
    moving_average_200: Optional[float] = None
    
    class Config:
        from_attributes = True


class PredictionSchema(BaseModel):
    """Stock prediction response schema."""
    id: int
    stock_id: int
    prediction_date: datetime
    predicted_price: float = Field(..., description="Predicted stock price")
    price_confidence: Optional[float] = Field(None, ge=0, le=1, description="Confidence in price prediction")
    predicted_volatility: Optional[float] = None
    price_change_percent: Optional[float] = None
    recommendation: str = Field(..., description="BUY, SELL, or HOLD")
    recommendation_confidence: Optional[float] = Field(None, ge=0, le=1)
    recommendation_reason: Optional[str] = None
    technical_indicators: TechnicalIndicatorsSchema
    news_sentiment_score: Optional[float] = Field(None, ge=-1, le=1)
    sentiment_impact: Optional[float] = None
    market_correlation: Optional[float] = None
    index_influence: Optional[float] = None
    model_version: Optional[str] = None
    
    class Config:
        from_attributes = True


class PredictionCreateSchema(BaseModel):
    """Schema for creating stock predictions."""
    predicted_price: float = Field(..., description="Predicted stock price")
    price_confidence: Optional[float] = Field(None, ge=0, le=1)
    predicted_volatility: Optional[float] = None
    price_change_percent: Optional[float] = None
    recommendation: str = Field(..., description="BUY, SELL, or HOLD")
    recommendation_confidence: Optional[float] = None
    recommendation_reason: Optional[str] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    bollinger_bands_signal: Optional[str] = None
    moving_average_50: Optional[float] = None
    moving_average_200: Optional[float] = None
    news_sentiment_score: Optional[float] = None
    sentiment_impact: Optional[float] = None
    market_correlation: Optional[float] = None
    index_influence: Optional[float] = None
    model_version: Optional[str] = None


class PredictionDetailSchema(PredictionSchema):
    """Detailed prediction information."""
    stock_symbol: str = Field(..., description="Stock symbol")
    current_price: float = Field(..., description="Current stock price")
    target_date: datetime = Field(..., description="Target prediction date")
    days_to_target: int = Field(..., ge=0)
    price_upside: float = Field(..., description="Upside potential %")
    risk_reward_ratio: float = Field(..., description="Risk/Reward ratio")
    
    class Config:
        from_attributes = True


class BatchPredictionSchema(BaseModel):
    """Batch prediction request."""
    symbols: list[str] = Field(..., min_items=1, max_items=100)
    days_ahead: int = Field(default=30, ge=1, le=365)
    include_sentiment: bool = Field(default=True)
    include_technical: bool = Field(default=True)


class PredictionComparisonSchema(BaseModel):
    """Compare predictions across models/time periods."""
    symbol: str
    current_price: float
    historical_predictions: list[PredictionSchema]
    latest_prediction: PredictionSchema
    prediction_accuracy: Optional[float] = Field(None, ge=0, le=1)
    model_agreement: Optional[float] = Field(None, description="Agreement between models")
    
    class Config:
        from_attributes = True
