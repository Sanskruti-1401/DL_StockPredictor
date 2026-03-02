"""
Stock Predictor Backend Application.

A comprehensive full-stack stock prediction and analysis platform featuring:
- ML-based stock price prediction
- Technical indicators analysis
- News sentiment analysis
- Risk assessment and management
- Buy/Sell/Hold recommendations
- Performance tracking and analytics
"""

__version__ = "1.0.0"
__author__ = "Stock Predictor Team"

from .main import app, create_app

__all__ = ["app", "create_app"]
