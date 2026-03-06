"""
Market data fetching and management service using Polygon.io API.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import requests
import time

from ..db.models import Stock, PriceHistory
from ..core.config import settings

logger = logging.getLogger(__name__)

# Polygon.io API Configuration
POLYGON_BASE_URL = "https://api.polygon.io"
POLYGON_TIMEOUT = 10


class MarketDataService:
    """Service for fetching and managing market data via Polygon.io API."""

    def __init__(self, db: Session):
        self.db = db
        self.polygon_key = settings.POLYGON_API_KEY
        self.session = requests.Session()

    def fetch_price_history(self, symbol: str, days: int = 365) -> List[dict]:
        """
        Fetch historical price data from Polygon.io.
        
        **Polygon Endpoint**: `GET /v2/aggs/ticker/{tickerSymbol}/range/{multiplier}/{timespan}/{from}/{to}`
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            days: Number of days of history to fetch
            
        Returns:
            List of price data dictionaries with OHLCV data
        """
        try:
            logger.info(f"Fetching price history for {symbol} ({days} days) from Polygon.io")
            
            to_date = datetime.utcnow().date()
            from_date = to_date - timedelta(days=days)
            
            # Polygon API endpoint for daily aggregates
            endpoint = (
                f"{POLYGON_BASE_URL}/v2/aggs/ticker/{symbol}/range/1/day/"
                f"{from_date}/{to_date}"
            )
            
            params = {
                "apiKey": self.polygon_key,
                "sort": "asc",
                "limit": 50000  # Max per request
            }
            
            response = self.session.get(endpoint, params=params, timeout=POLYGON_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") != "OK":
                logger.warning(f"Polygon API returned status: {data.get('status')}")
                return []
            
            price_list = []
            for bar in data.get("results", []):
                price_data = {
                    "date": datetime.utcfromtimestamp(bar.get("t", 0) / 1000).date(),
                    "open": bar.get("o"),
                    "high": bar.get("h"),
                    "low": bar.get("l"),
                    "close": bar.get("c"),
                    "volume": bar.get("v"),
                    "adjusted_close": bar.get("c"),  # Polygon provides adjusted close if available
                }
                price_list.append(price_data)
            
            logger.info(f"Fetched {len(price_list)} days of price history for {symbol}")
            return price_list
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Polygon API request error for {symbol}: {e}")
            return []
        except Exception as e:
            logger.error(f"Error fetching price history for {symbol}: {e}")
            return []

    def get_latest_quote(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get latest quote/price for a stock.
        
        **Polygon Endpoint**: `GET /v2/aggs/ticker/{tickerSymbol}/prev`
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Dictionary with latest quote data or None
        """
        try:
            logger.info(f"Fetching latest quote for {symbol}")
            
            # Polygon API endpoint for previous close
            endpoint = f"{POLYGON_BASE_URL}/v2/aggs/ticker/{symbol}/prev"
            
            params = {"apiKey": self.polygon_key}
            
            response = self.session.get(endpoint, params=params, timeout=POLYGON_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") != "OK":
                logger.warning(f"Polygon API returned status for latest quote: {data.get('status')}")
                return None
            
            results = data.get("results", [])
            if not results:
                return None
            
            bar = results[0]
            quote = {
                "symbol": symbol,
                "date": datetime.utcfromtimestamp(bar.get("t", 0) / 1000).date(),
                "open": bar.get("o"),
                "high": bar.get("h"),
                "low": bar.get("l"),
                "close": bar.get("c"),
                "volume": bar.get("v"),
                "vwap": bar.get("vw"),  # Volume weighted average price
            }
            
            logger.info(f"Latest quote for {symbol}: ${quote['close']}")
            return quote
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Polygon API request error for latest quote {symbol}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching latest quote for {symbol}: {e}")
            return None

    def get_stock_details(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Get stock ticker details (company info, market metrics).
        
        **Polygon Endpoint**: `GET /v3/reference/tickers/{tickerSymbol}`
        
        Args:
            symbol: Stock symbol
            
        Returns:
            Dictionary with stock details or None
        """
        try:
            logger.info(f"Fetching stock details for {symbol}")
            
            # Polygon ticker details endpoint
            endpoint = f"{POLYGON_BASE_URL}/v3/reference/tickers/{symbol}"
            
            params = {"apiKey": self.polygon_key}
            
            response = self.session.get(endpoint, params=params, timeout=POLYGON_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") != "OK":
                logger.warning(f"Polygon API returned status for ticker details: {data.get('status')}")
                return None
            
            ticker = data.get("results", {})
            details = {
                "symbol": ticker.get("ticker"),
                "name": ticker.get("name"),
                "market": ticker.get("market"),
                "locale": ticker.get("locale"),
                "currency": ticker.get("currency_name"),
                "type": ticker.get("type"),
                "active": ticker.get("active"),
            }
            
            return details
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Polygon API request error for ticker details {symbol}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching stock details for {symbol}: {e}")
            return None
        """
        Store or update price data in database.
        
        Args:
            stock_id: Stock ID
            price_data: Price data dictionary
            
        Returns:
            Created/updated PriceHistory record
        """
        try:
            # Check if price data already exists for this date
            existing = self.db.query(PriceHistory).filter(
                PriceHistory.stock_id == stock_id,
                PriceHistory.date == price_data['date']
            ).first()
            
            if existing:
                # Update existing record
                for key, value in price_data.items():
                    if key != 'date':
                        setattr(existing, key, value)
            else:
                # Create new record
                existing = PriceHistory(
                    stock_id=stock_id,
                    date=price_data['date'],
                    open_price=price_data.get('open', 0.0),
                    high_price=price_data.get('high', 0.0),
                    low_price=price_data.get('low', 0.0),
                    close_price=price_data.get('close', 0.0),
                    volume=price_data.get('volume'),
                    adjusted_close=price_data.get('adjusted_close'),
                )
                self.db.add(existing)
            
            self.db.commit()
            self.db.refresh(existing)
            return existing
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating price data: {e}")
            return None

    def get_latest_price(self, stock_id: int) -> Optional[float]:
        """Get the latest closing price for a stock."""
        try:
            latest = self.db.query(PriceHistory).filter(
                PriceHistory.stock_id == stock_id
            ).order_by(PriceHistory.date.desc()).first()
            
            return latest.close_price if latest else None
        except Exception as e:
            logger.error(f"Error getting latest price: {e}")
            return None

    def get_price_range(self, stock_id: int, days: int = 365) -> dict:
        """Get price range statistics for a stock."""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            prices = self.db.query(PriceHistory).filter(
                PriceHistory.stock_id == stock_id,
                PriceHistory.date >= cutoff_date
            ).order_by(PriceHistory.date.asc()).all()
            
            if not prices:
                return {}
            
            closing_prices = [p.close_price for p in prices]
            
            return {
                "high_52_week": max(closing_prices),
                "low_52_week": min(closing_prices),
                "average_price": sum(closing_prices) / len(closing_prices),
                "current_price": closing_prices[-1],
            }
        except Exception as e:
            logger.error(f"Error getting price range: {e}")
            return {}

    def sync_market_data(self, symbols: List[str], days: int = 365) -> dict:
        """
        On-demand refresh: Sync market data for a list of stocks from Polygon.io.
        
        **Data Flow**:
        1. Query `/v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}` for historical data
        2. Store in PriceHistory table
        3. Query `/v2/aggs/ticker/{symbol}/prev` for latest quote
        4. Return sync statistics
        
        Args:
            symbols: List of stock symbols
            days: Number of days of history to fetch
            
        Returns:
            Sync statistics dictionary
        """
        stats = {
            "total": len(symbols),
            "synced": 0,
            "failed": 0,
            "errors": [],
            "records_created": 0,
            "started_at": datetime.utcnow().isoformat(),
        }
        
        try:
            for symbol in symbols:
                try:
                    # Fetch stock from database
                    stock = self.db.query(Stock).filter(Stock.symbol == symbol).first()
                    if not stock:
                        stats["failed"] += 1
                        stats["errors"].append(f"Stock {symbol} not found in database")
                        logger.warning(f"Stock {symbol} not found")
                        continue
                    
                    logger.info(f"Syncing data for {symbol} (stock_id: {stock.id})")
                    
                    # Fetch price history from Polygon
                    price_data_list = self.fetch_price_history(symbol, days)
                    if not price_data_list:
                        stats["errors"].append(f"No price data retrieved for {symbol}")
                        logger.warning(f"No price data for {symbol}")
                        continue
                    
                    # Update database with price history
                    for price_data in price_data_list:
                        result = self.update_price_data(stock.id, price_data)
                        if result:
                            stats["records_created"] += 1
                    
                    stats["synced"] += 1
                    logger.info(f"Successfully synced {symbol}: {len(price_data_list)} records")
                    
                except Exception as e:
                    stats["failed"] += 1
                    error_msg = f"Error syncing {symbol}: {str(e)}"
                    stats["errors"].append(error_msg)
                    logger.error(error_msg)
                
                # Rate limiting for Polygon API
                time.sleep(0.1)
            
            stats["completed_at"] = datetime.utcnow().isoformat()
            return stats
            
        except Exception as e:
            logger.error(f"Error in sync_market_data: {e}")
            stats["errors"].append(f"Critical error: {str(e)}")
            return stats

    def refresh_latest_prices(self, symbols: List[str]) -> dict:
        """
        Quick refresh of latest prices for a list of stocks.
        
        **Polygon Endpoint**: `GET /v2/aggs/ticker/{tickerSymbol}/prev`
        
        Args:
            symbols: List of stock symbols to refresh
            
        Returns:
            Dictionary with latest prices
        """
        stats = {
            "total": len(symbols),
            "updated": 0,
            "failed": 0,
            "quotes": {},
            "errors": [],
            "updated_at": datetime.utcnow().isoformat(),
        }
        
        try:
            for symbol in symbols:
                try:
                    stock = self.db.query(Stock).filter(Stock.symbol == symbol).first()
                    if not stock:
                        stats["failed"] += 1
                        continue
                    
                    quote = self.get_latest_quote(symbol)
                    if quote:
                        # Update latest price in database
                        self.update_price_data(stock.id, {
                            "date": quote["date"],
                            "open": quote.get("open", 0),
                            "high": quote.get("high", 0),
                            "low": quote.get("low", 0),
                            "close": quote.get("close", 0),
                            "volume": quote.get("volume", 0),
                        })
                        
                        stats["quotes"][symbol] = quote
                        stats["updated"] += 1
                    else:
                        stats["failed"] += 1
                        stats["errors"].append(f"No quote data for {symbol}")
                    
                except Exception as e:
                    stats["failed"] += 1
                    stats["errors"].append(f"Error refreshing {symbol}: {str(e)}")
                    logger.error(f"Error refreshing {symbol}: {e}")
                
                # Rate limiting
                time.sleep(0.1)
            
            return stats
            
        except Exception as e:
            logger.error(f"Error in refresh_latest_prices: {e}")
            return stats

    def calculate_returns(self, stock_id: int, period: str = "1M") -> Optional[float]:
        """
        Calculate stock returns for a period.
        
        Args:
            stock_id: Stock ID
            period: Period (1M, 3M, 6M, 1Y)
            
        Returns:
            Return percentage
        """
        try:
            period_days = {
                "1M": 30,
                "3M": 90,
                "6M": 180,
                "1Y": 365,
            }.get(period, 30)
            
            cutoff_date = datetime.utcnow() - timedelta(days=period_days)
            
            current = self.db.query(PriceHistory).filter(
                PriceHistory.stock_id == stock_id
            ).order_by(PriceHistory.date.desc()).first()
            
            past = self.db.query(PriceHistory).filter(
                PriceHistory.stock_id == stock_id,
                PriceHistory.date <= cutoff_date
            ).order_by(PriceHistory.date.desc()).first()
            
            if current and past:
                return_pct = ((current.close_price - past.close_price) / past.close_price) * 100
                return float(return_pct)
            
            return None
        except Exception as e:
            logger.error(f"Error calculating returns: {e}")
            return None

    def calculate_technical_indicators(self, stock_id: int) -> Dict[str, float]:
        """
        Calculate technical indicators (RSI, MACD, Bollinger Bands, Moving Averages).
        
        These indicators are derived from PriceHistory data in the database.
        
        Args:
            stock_id: Stock ID
            
        Returns:
            Dictionary with calculated indicators
        """
        try:
            # Get last 200 days of data for indicators
            cutoff_date = datetime.utcnow() - timedelta(days=200)
            prices = self.db.query(PriceHistory).filter(
                PriceHistory.stock_id == stock_id,
                PriceHistory.date >= cutoff_date
            ).order_by(PriceHistory.date.asc()).all()
            
            if len(prices) < 14:
                return {}
            
            closes = [p.close_price for p in prices]
            
            indicators = {
                "moving_average_50": self._calculate_sma(closes, 50),
                "moving_average_200": self._calculate_sma(closes, 200),
                "rsi_14": self._calculate_rsi(closes, 14),
                "latest_close": closes[-1],
            }
            
            return indicators
            
        except Exception as e:
            logger.error(f"Error calculating technical indicators: {e}")
            return {}

    def _calculate_sma(self, prices: List[float], period: int) -> float:
        """Calculate Simple Moving Average."""
        if len(prices) < period:
            return 0.0
        return sum(prices[-period:]) / period

    def _calculate_rsi(self, prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index."""
        if len(prices) < period + 1:
            return 50.0
        
        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [d if d > 0 else 0 for d in deltas]
        losses = [-d if d < 0 else 0 for d in deltas]
        
        avg_gain = sum(gains[-period:]) / period
        avg_loss = sum(losses[-period:]) / period
        
        if avg_loss == 0:
            return 100.0 if avg_gain > 0 else 50.0
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
