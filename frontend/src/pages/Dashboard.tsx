/**
 * Dashboard Page Component
 */

import React, { useEffect, useState } from 'react';
import { useStock } from '../states/store';
import { Stock, StockDetail, stockEndpoints, Prediction, predictionEndpoints } from '../api/endpoint';
import { PriceChart } from '../components/PriceChart';
import { BuySellHoldCard } from '../components/BuySellHoldCard';
import { RiskWidgets } from '../components/RiskWidgets';
import { NewsSentimentCard } from '../components/NewsSentimentCard';
import { IndicatorPanel } from '../components/IndicatorPanel';
import '../styles/dashboard.css';

export const Dashboard: React.FC = () => {
  const { watchlist, selectedStock, setSelectedStock } = useStock();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStockData, setSelectedStockData] = useState<StockDetail | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'risk'>('overview');

  useEffect(() => {
    const loadStocks = async () => {
      try {
        setLoading(true);
        const { data } = await stockEndpoints.listStocks(0, 20);
        if (data) {
          setStocks(data);
          if (!selectedStock && data.length > 0) {
            setSelectedStock(data[0].id);
          }
        }
      } catch (err) {
        setError('Failed to load stocks');
      } finally {
        setLoading(false);
      }
    };

    loadStocks();
  }, []);

  useEffect(() => {
    if (!selectedStock) return;

    const loadStockDetails = async () => {
      try {
        const [stockRes, predictionRes] = await Promise.all([
          stockEndpoints.getStock(selectedStock),
          predictionEndpoints.getLatestPrediction(selectedStock),
        ]);

        if (stockRes.data) {
          setSelectedStockData(stockRes.data);
        }
        if (predictionRes.data) {
          setPrediction(predictionRes.data);
        }
      } catch (err) {
        setError('Failed to load stock details');
      }
    };

    loadStockDetails();
  }, [selectedStock]);

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Stock Predictor Dashboard</h1>
        <p className="subtitle">AI-powered stock analysis and predictions</p>
      </div>

      <div className="dashboard-content">
        {/* Left Sidebar - Stock List */}
        <div className="dashboard-sidebar">
          <div className="sidebar-section">
            <h3>My Watchlist</h3>
            {watchlist.length === 0 ? (
              <p className="empty-message">No stocks in watchlist</p>
            ) : (
              <div className="stock-list">
                {stocks
                  .filter((s: any) => watchlist.includes(s.id))
                  .map((stock: any) => (
                    <button
                      key={stock.id}
                      className={`stock-item ${selectedStock === stock.id ? 'active' : ''}`}
                      onClick={() => setSelectedStock(stock.id)}
                    >
                      <span className="symbol">{stock.symbol}</span>
                      <span className="name">{stock.name}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="sidebar-section">
            <h3>Featured Stocks</h3>
            <div className="stock-list">
              {stocks.slice(0, 5).map((stock: any) => (
                <button
                  key={stock.id}
                  className={`stock-item ${selectedStock === stock.id ? 'active' : ''}`}
                  onClick={() => setSelectedStock(stock.id)}
                >
                  <span className="symbol">{stock.symbol}</span>
                  <span className="name">{stock.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          {selectedStockData ? (
            <>
              {/* Stock Header */}
              <div className="stock-header">
                <div className="stock-title">
                  <h2>{selectedStockData.symbol}</h2>
                  <p className="stock-name">{selectedStockData.name}</p>
                </div>
                <div className="stock-price">
                  <div className="price">${selectedStockData.current_price.toFixed(2)}</div>
                  <div
                    className={`price-change ${selectedStockData.price_change_percent >= 0 ? 'positive' : 'negative'}`}
                  >
                    {selectedStockData.price_change_percent >= 0 ? '+' : ''}
                    {selectedStockData.price_change_percent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="dashboard-tabs">
                <button
                  className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analysis')}
                >
                  Analysis
                </button>
                <button
                  className={`tab ${activeTab === 'risk' ? 'active' : ''}`}
                  onClick={() => setActiveTab('risk')}
                >
                  Risk
                </button>
              </div>

              {/* Tab Content */}
              <div className="dashboard-tab-content">
                {activeTab === 'overview' && (
                  <div className="tab-panel">
                    <div className="overview-grid">
                      <div className="overview-item">
                        <span className="label">52 Week High</span>
                        <span className="value">${selectedStockData.fifty_two_week_high.toFixed(2)}</span>
                      </div>
                      <div className="overview-item">
                        <span className="label">52 Week Low</span>
                        <span className="value">${selectedStockData.fifty_two_week_low.toFixed(2)}</span>
                      </div>
                      <div className="overview-item">
                        <span className="label">Market Cap</span>
                        <span className="value">
                          {selectedStockData.market_cap
                            ? `$${(selectedStockData.market_cap / 1e9).toFixed(2)}B`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="overview-item">
                        <span className="label">P/E Ratio</span>
                        <span className="value">
                          {selectedStockData.pe_ratio?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                      <div className="overview-item">
                        <span className="label">Dividend Yield</span>
                        <span className="value">
                          {selectedStockData.dividend_yield
                            ? `${(selectedStockData.dividend_yield * 100).toFixed(2)}%`
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="overview-item">
                        <span className="label">Beta</span>
                        <span className="value">{selectedStockData.beta?.toFixed(2) || 'N/A'}</span>
                      </div>
                    </div>

                    <PriceChart
                      stockId={selectedStockData.id}
                      symbol={selectedStockData.symbol}
                      days={365}
                      height={400}
                    />

                    <NewsSentimentCard
                      stockId={selectedStockData.id}
                      symbol={selectedStockData.symbol}
                      days={7}
                    />
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div className="tab-panel">
                    <BuySellHoldCard
                      stockId={selectedStockData.id}
                      symbol={selectedStockData.symbol}
                      currentPrice={selectedStockData.current_price}
                    />

                    {prediction && (
                      <IndicatorPanel
                        indicators={{
                          rsi: prediction.rsi,
                          macd: prediction.macd,
                          bollinger_bands_signal: prediction.bollinger_bands_signal,
                          moving_average_50: prediction.moving_average_50,
                          moving_average_200: prediction.moving_average_200,
                        }}
                        currentPrice={selectedStockData.current_price}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'risk' && (
                  <div className="tab-panel">
                    <RiskWidgets
                      stockId={selectedStockData.id}
                      symbol={selectedStockData.symbol}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">Select a stock to view details</div>
          )}
        </div>
      </div>
    </div>
  );
};
