/**
 * Stock Detail Page Component
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { StockDetail as StockDetailType } from '../api/endpoint';
import { stockEndpoints } from '../api/endpoint';
import { PriceChart } from '../components/PriceChart';
import { BuySellHoldCard } from '../components/BuySellHoldCard';
import { RiskWidgets } from '../components/RiskWidgets';
import { NewsSentimentCard } from '../components/NewsSentimentCard';
import '../styles/stock-detail.css';

export const StockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stock, setStock] = useState<StockDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadStock = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await stockEndpoints.getStock(parseInt(id));
        if (err) {
          setError(err);
        } else if (data) {
          setStock(data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadStock();
  }, [id]);

  if (loading) {
    return <div className="stock-detail-loading">Loading stock details...</div>;
  }

  if (error) {
    return <div className="stock-detail-error">Error: {error}</div>;
  }

  if (!stock) {
    return <div className="stock-detail-empty">Stock not found</div>;
  }

  return (
    <div className="stock-detail">
      <div className="stock-detail-header">
        <div className="stock-title-section">
          <h1>{stock.symbol}</h1>
          <p className="stock-name">{stock.name}</p>
          {stock.sector && <span className="stock-sector">{stock.sector}</span>}
        </div>

        <div className="stock-price-section">
          <div className="current-price">${stock.current_price.toFixed(2)}</div>
          <div
            className={`price-change ${stock.price_change_percent >= 0 ? 'positive' : 'negative'}`}
          >
            {stock.price_change_percent >= 0 ? '+' : ''}
            {stock.price_change_percent.toFixed(2)}% ({stock.price_change.toFixed(2)})
          </div>
        </div>
      </div>

      <div className="stock-detail-overview">
        <div className="overview-card">
          <h3>Company Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Industry</span>
              <span className="value">{stock.industry || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Sector</span>
              <span className="value">{stock.sector || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Market Cap</span>
              <span className="value">
                {stock.market_cap ? `$${(stock.market_cap / 1e9).toFixed(2)}B` : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">P/E Ratio</span>
              <span className="value">{stock.pe_ratio?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">Dividend Yield</span>
              <span className="value">
                {stock.dividend_yield ? `${(stock.dividend_yield * 100).toFixed(2)}%` : 'N/A'}
              </span>
            </div>
            <div className="info-item">
              <span className="label">Beta</span>
              <span className="value">{stock.beta?.toFixed(2) || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="label">52 Week High</span>
              <span className="value">${stock.fifty_two_week_high.toFixed(2)}</span>
            </div>
            <div className="info-item">
              <span className="label">52 Week Low</span>
              <span className="value">${stock.fifty_two_week_low.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="stock-detail-content">
        {/* Price Chart */}
        <section className="detail-section">
          <PriceChart
            stockId={stock.id}
            symbol={stock.symbol}
            days={365}
            height={500}
          />
        </section>

        {/* Recommendation */}
        <section className="detail-section">
          <BuySellHoldCard
            stockId={stock.id}
            symbol={stock.symbol}
            currentPrice={stock.current_price}
          />
        </section>

        {/* Sentiment Analysis */}
        <section className="detail-section">
          <NewsSentimentCard
            stockId={stock.id}
            symbol={stock.symbol}
            days={30}
          />
        </section>

        {/* Risk Analysis */}
        <section className="detail-section">
          <RiskWidgets
            stockId={stock.id}
            symbol={stock.symbol}
          />
        </section>
      </div>

      <div className="stock-detail-footer">
        <p className="disclaimer">
          ⚠️ This information is for educational purposes only and should not be considered as
          financial advice. Always consult with a qualified financial advisor before making
          investment decisions.
        </p>
      </div>
    </div>
  );
};
