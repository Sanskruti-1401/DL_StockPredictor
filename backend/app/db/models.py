"""
Database models for Stock Predictor.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Stock(Base):
    """Stock model for storing stock information."""
    __tablename__ = "stocks"
    __table_args__ = (UniqueConstraint("symbol", name="uq_stock_symbol"),)

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    sector = Column(String(100))
    industry = Column(String(100))
    market_cap = Column(Float)
    pe_ratio = Column(Float)
    dividend_yield = Column(Float)
    beta = Column(Float)
    active = Column(Boolean, default=True, index=True)  # For tracking which stocks to refresh
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    predictions = relationship("StockPrediction", back_populates="stock", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="stock", cascade="all, delete-orphan")
    news_articles = relationship("NewsArticle", back_populates="stock", cascade="all, delete-orphan")
    risk_metrics = relationship("RiskMetric", back_populates="stock", cascade="all, delete-orphan")
    technical_indicators = relationship("TechnicalIndicator", back_populates="stock", cascade="all, delete-orphan")


class PriceHistory(Base):
    """Historical price data for stocks."""
    __tablename__ = "price_history"
    __table_args__ = (UniqueConstraint("stock_id", "date", name="uq_stock_date"),)

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    open_price = Column(Float, nullable=False)
    high_price = Column(Float, nullable=False)
    low_price = Column(Float, nullable=False)
    close_price = Column(Float, nullable=False)
    volume = Column(Integer)
    adjusted_close = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    stock = relationship("Stock", back_populates="price_history")


class StockPrediction(Base):
    """Stock price predictions and recommendations."""
    __tablename__ = "stock_predictions"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    prediction_date = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Prediction details
    predicted_price = Column(Float, nullable=False)
    price_confidence = Column(Float)  # 0-1 confidence score
    predicted_volatility = Column(Float)
    price_change_percent = Column(Float)
    
    # Recommendation
    recommendation = Column(String(10), nullable=False)  # BUY, SELL, HOLD
    recommendation_confidence = Column(Float)  # 0-1 confidence score
    recommendation_reason = Column(Text)
    
    # Technical indicators influence
    rsi = Column(Float)
    macd = Column(Float)
    bollinger_bands_signal = Column(String(10))
    moving_average_50 = Column(Float)
    moving_average_200 = Column(Float)
    
    # Sentiment influence
    news_sentiment_score = Column(Float)  # -1 to 1
    sentiment_impact = Column(Float)  # Impact on price
    
    # Market factors
    market_correlation = Column(Float)
    index_influence = Column(Float)  # Market index influence
    
    # Model metadata
    model_version = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    stock = relationship("Stock", back_populates="predictions")


class TechnicalIndicator(Base):
    """Technical indicators for stocks."""
    __tablename__ = "technical_indicators"
    __table_args__ = (UniqueConstraint("stock_id", "date", name="uq_tech_stock_date"),)

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    
    # Momentum indicators
    rsi = Column(Float)  # Relative Strength Index
    macd = Column(Float)  # MACD value
    macd_signal = Column(Float)
    
    # Moving averages
    sma_20 = Column(Float)  # Simple Moving Average 20-day
    sma_50 = Column(Float)
    sma_200 = Column(Float)
    ema_12 = Column(Float)  # Exponential Moving Average 12-day
    ema_26 = Column(Float)
    
    # Bollinger Bands
    bb_upper = Column(Float)
    bb_middle = Column(Float)
    bb_lower = Column(Float)
    
    # Volume indicators
    ad_line = Column(Float)  # Accumulation/Distribution
    obv = Column(Float)  # On-Balance Volume
    
    # Volatility
    atr = Column(Float)  # Average True Range
    volatility = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    stock = relationship("Stock", back_populates="technical_indicators")


class NewsArticle(Base):
    """News articles related to stocks."""
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    
    title = Column(String(500), nullable=False)
    description = Column(Text)
    source = Column(String(100))
    url = Column(String(500), unique=True, index=True)
    
    # Sentiment analysis
    sentiment = Column(String(20))  # POSITIVE, NEGATIVE, NEUTRAL
    sentiment_score = Column(Float)  # -1 to 1
    confidence = Column(Float)
    
    published_date = Column(DateTime)
    fetched_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    stock = relationship("Stock", back_populates="news_articles")


class RiskMetric(Base):
    """Risk assessment metrics for stocks."""
    __tablename__ = "risk_metrics"
    __table_args__ = (UniqueConstraint("stock_id", "date", name="uq_risk_stock_date"),)

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    date = Column(DateTime, nullable=False, index=True)
    
    # Risk metrics
    volatility = Column(Float, nullable=False)  # Standard deviation
    beta = Column(Float)  # Market beta
    value_at_risk = Column(Float)  # VaR at 95%
    max_drawdown = Column(Float)
    sharpe_ratio = Column(Float)
    sortino_ratio = Column(Float)
    
    # Recent performance
    return_1_month = Column(Float)
    return_3_month = Column(Float)
    return_6_month = Column(Float)
    return_1_year = Column(Float)
    
    # Risk level
    risk_level = Column(String(20))  # LOW, MEDIUM, HIGH, VERY_HIGH
    risk_score = Column(Float)  # 0-100
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    stock = relationship("Stock", back_populates="risk_metrics")


class PerformanceSummary(Base):
    """Performance summary of stocks."""
    __tablename__ = "performance_summary"
    __table_args__ = (UniqueConstraint("stock_id", "period", name="uq_perf_stock_period"),)

    id = Column(Integer, primary_key=True, index=True)
    stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
    period = Column(String(50), nullable=False)  # 1M, 3M, 6M, 1Y, ALL
    
    # Returns
    total_return = Column(Float)
    annualized_return = Column(Float)
    
    # Risk metrics
    volatility = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    
    # Comparison
    outperformance = Column(Float)  # vs benchmark
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    stock = relationship("Stock")


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_user_email"),)

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
