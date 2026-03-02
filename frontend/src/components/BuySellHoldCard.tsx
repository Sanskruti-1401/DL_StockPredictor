/**
 * Buy/Sell/Hold Recommendation Card Component
 */

import { useEffect, useState } from 'react';
import { Prediction, predictionEndpoints } from '../api/endpoint';
import '../styles/recommendation.css';

interface BuySellHoldCardProps {
  stockId: number;
  symbol: string;
  currentPrice: number;
}

export const BuySellHoldCard = ({
  stockId,
  symbol,
  currentPrice,
}: BuySellHoldCardProps): JSX.Element => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPrediction = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await predictionEndpoints.getLatestPrediction(stockId);
        if (err) {
          setError(err);
        } else if (data) {
          setPrediction(data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPrediction();
  }, [stockId]);

  if (loading) return <div className="recommendation-loading">Loading recommendation...</div>;
  if (error) return <div className="recommendation-error">Error: {error}</div>;
  if (!prediction) return <div className="recommendation-empty">No prediction available</div>;

  const getRecommendationClass = (rec: string) => {
    switch (rec.toUpperCase()) {
      case 'BUY':
        return 'buy';
      case 'SELL':
        return 'sell';
      case 'HOLD':
        return 'hold';
      default:
        return 'neutral';
    }
  };

  const priceUpside =
    ((prediction.predicted_price - currentPrice) / currentPrice) * 100;

  return (
    <div className="recommendation-card">
      <div className="recommendation-header">
        <h3>{symbol} - Investment Recommendation</h3>
        <span className="prediction-date">
          {new Date(prediction.prediction_date).toLocaleDateString()}
        </span>
      </div>

      <div className={`recommendation-badge ${getRecommendationClass(prediction.recommendation)}`}>
        <div className="recommendation-text">{prediction.recommendation}</div>
        <div className="recommendation-confidence">
          Confidence: {((prediction.recommendation_confidence || 0.5) * 100).toFixed(0)}%
        </div>
      </div>

      <div className="recommendation-details">
        <div className="detail-row">
          <span className="label">Current Price:</span>
          <span className="value">${currentPrice.toFixed(2)}</span>
        </div>

        <div className="detail-row">
          <span className="label">Predicted Price:</span>
          <span className={`value ${priceUpside >= 0 ? 'positive' : 'negative'}`}>
            ${prediction.predicted_price.toFixed(2)}
          </span>
        </div>

        <div className="detail-row">
          <span className="label">Price Target:</span>
          <span className={`value ${priceUpside >= 0 ? 'positive' : 'negative'}`}>
            {priceUpside >= 0 ? '+' : ''}
            {priceUpside.toFixed(2)}%
          </span>
        </div>

        {prediction.recommendation_reason && (
          <div className="detail-row full">
            <span className="label">Reason:</span>
            <span className="value">{prediction.recommendation_reason}</span>
          </div>
        )}
      </div>

      <div className="recommendation-factors">
        <h4>Analysis Factors</h4>
        <div className="factors-grid">
          {prediction.rsi !== undefined && (
            <div className="factor">
              <span className="factor-label">RSI</span>
              <span className="factor-value">{prediction.rsi.toFixed(1)}</span>
            </div>
          )}
          {prediction.news_sentiment_score !== undefined && (
            <div className="factor">
              <span className="factor-label">Sentiment</span>
              <span className="factor-value">
                {prediction.news_sentiment_score > 0 ? '+' : ''}
                {prediction.news_sentiment_score.toFixed(2)}
              </span>
            </div>
          )}
          {prediction.moving_average_50 !== undefined && (
            <div className="factor">
              <span className="factor-label">MA50 Ratio</span>
              <span className="factor-value">
                {((currentPrice / prediction.moving_average_50) * 100).toFixed(1)}%
              </span>
            </div>
          )}
          {prediction.predicted_volatility !== undefined && (
            <div className="factor">
              <span className="factor-label">Volatility</span>
              <span className="factor-value">{(prediction.predicted_volatility * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className="recommendation-disclaimer">
        <p>
          ⚠️ This recommendation is based on historical data, technical analysis, and news
          sentiment. It should not be considered as financial advice. Always do your own research
          before making investment decisions.
        </p>
      </div>
    </div>
  );
};
