"""
Background jobs and scheduled tasks.
"""
import logging
from datetime import datetime
from typing import List
from sqlalchemy.orm import Session

from ..db.base import SessionLocal
from ...db.models import Stock
from ...services.market_data import MarketDataService
from ...services.news_sentiment import NewsSentimentService
from ...services.indicators import IndicatorsService
from ...services.risk import RiskService

logger = logging.getLogger(__name__)


class JobScheduler:
    """Scheduler for background jobs."""

    @staticmethod
    def sync_all_market_data():
        """Job to sync market data for all stocks."""
        db = SessionLocal()
        try:
            service = MarketDataService(db)
            
            # Get all active stocks
            stocks = db.query(Stock).all()
            symbols = [s.symbol for s in stocks]
            
            if symbols:
                result = service.sync_market_data(symbols)
                logger.info(f"Market data sync completed: {result}")
            
        except Exception as e:
            logger.error(f"Error in market data sync job: {e}")
        finally:
            db.close()

    @staticmethod
    def sync_all_news():
        """Job to sync news for all stocks."""
        db = SessionLocal()
        try:
            service = NewsSentimentService(db)
            
            # Get all active stocks
            stocks = db.query(Stock).all()
            symbols = [s.symbol for s in stocks]
            
            if symbols:
                result = service.sync_news(symbols)
                logger.info(f"News sync completed: {result}")
            
        except Exception as e:
            logger.error(f"Error in news sync job: {e}")
        finally:
            db.close()

    @staticmethod
    def calculate_all_indicators():
        """Job to calculate technical indicators for all stocks."""
        db = SessionLocal()
        try:
            service = IndicatorsService(db)
            
            # Get all active stocks
            stocks = db.query(Stock).all()
            stock_ids = [s.id for s in stocks]
            
            if stock_ids:
                result = service.batch_calculate_indicators(stock_ids)
                logger.info(f"Technical indicators calculation completed: {result}")
            
        except Exception as e:
            logger.error(f"Error in indicators calculation job: {e}")
        finally:
            db.close()

    @staticmethod
    def calculate_all_risk_metrics():
        """Job to calculate risk metrics for all stocks."""
        db = SessionLocal()
        try:
            service = RiskService(db)
            
            # Get all active stocks
            stocks = db.query(Stock).all()
            
            for stock in stocks:
                try:
                    service.create_risk_metric(stock.id, stock)
                    logger.info(f"Risk metrics calculated for {stock.symbol}")
                except Exception as e:
                    logger.error(f"Error calculating risk metrics for {stock.symbol}: {e}")
            
        except Exception as e:
            logger.error(f"Error in risk metrics calculation job: {e}")
        finally:
            db.close()


# Job configuration for scheduled execution
# Can be integrated with APScheduler, Celery, etc.
SCHEDULED_JOBS = [
    {
        "name": "sync_market_data",
        "function": JobScheduler.sync_all_market_data,
        "trigger": "cron",
        "hour": "*/4",  # Every 4 hours
        "minute": "0"
    },
    {
        "name": "sync_news",
        "function": JobScheduler.sync_all_news,
        "trigger": "cron",
        "hour": "*/6",  # Every 6 hours
        "minute": "0"
    },
    {
        "name": "calculate_indicators",
        "function": JobScheduler.calculate_all_indicators,
        "trigger": "cron",
        "hour": "*/4",  # Every 4 hours
        "minute": "15"
    },
    {
        "name": "calculate_risk_metrics",
        "function": JobScheduler.calculate_all_risk_metrics,
        "trigger": "cron",
        "hour": "*/6",  # Every 6 hours
        "minute": "30"
    },
]


def setup_scheduler():
    """Setup APScheduler for background jobs."""
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        
        scheduler = BackgroundScheduler()
        
        for job in SCHEDULED_JOBS:
            scheduler.add_job(
                job["function"],
                trigger=job["trigger"],
                hour=job.get("hour"),
                minute=job.get("minute"),
                id=job["name"],
                name=job["name"],
                replace_existing=True
            )
        
        scheduler.start()
        logger.info("Background scheduler started successfully")
        return scheduler
    except ImportError:
        logger.warning("APScheduler not installed. Background jobs will not run automatically.")
        return None
    except Exception as e:
        logger.error(f"Error setting up scheduler: {e}")
        return None
