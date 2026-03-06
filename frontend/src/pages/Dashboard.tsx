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

  console.log('🎨 [Dashboard] Render:', { stocks: stocks.length, loading, error, selectedStock });

  useEffect(() => {
    const loadStocks = async () => {
      try {
        setLoading(true);
        console.log('📊 [Dashboard] Fetching stocks...');
        const { data, error: err } = await stockEndpoints.listStocks(0, 20);
        
        console.log('📊 [Dashboard] Response received:', { data, err });
        
        if (err) {
          console.error('❌ [Dashboard] Error from API:', err);
          setError(err);
        } else if (data) {
          console.log('✅ [Dashboard] Stocks loaded:', data.length, 'stocks');
          data.forEach((s: any) => console.log(`  - ${s.symbol}: ${s.name}`));
          setStocks(data);
          if (!selectedStock && data.length > 0) {
            setSelectedStock(data[0].id);
          }
        } else {
          console.warn('⚠️ [Dashboard] No data returned');
        }
      } catch (err) {
        console.error('💥 [Dashboard] Caught exception:', err);
        setError('Failed to load stocks: ' + (err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadStocks();
  }, []);

  useEffect(() => {
    if (!selectedStock) {
      console.log('⏭️ [Dashboard] No selectedStock, skipping detail load');
      return;
    }

    const loadStockDetails = async () => {
      try {
        console.log('📈 [Dashboard] Loading details for stock:', selectedStock);
        const stockRes = await stockEndpoints.getStock(selectedStock);
        
        console.log('📈 [Dashboard] Stock response:', { data: !!stockRes.data, error: stockRes.error });

        if (stockRes.data) {
          console.log('✅ [Dashboard] Setting selectedStockData');
          setSelectedStockData(stockRes.data);
        } else if (stockRes.error) {
          console.error('❌ [Dashboard] Stock fetch error:', stockRes.error);
        }
        
        // Predictions endpoint doesn't exist yet, skip it for now
        console.log('⏭️ [Dashboard] Skipping predictions (endpoint not yet implemented)');
        
      } catch (err) {
        console.error('💥 [Dashboard] Exception loading details:', err);
        setError('Failed to load stock details: ' + (err instanceof Error ? err.message : 'Unknown'));
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

      {/* Featured Stocks Bar - Horizontal */}
      <div className="featured-stocks-bar">
        <div className="featured-stocks-label">Featured Stocks</div>
        <div className="featured-stocks-scroll">
          {stocks.slice(0, 10).map((stock: any) => (
            <button
              key={stock.id}
              className={`featured-stock-chip ${selectedStock === stock.id ? 'active' : ''}`}
              onClick={() => setSelectedStock(stock.id)}
            >
              <span className="symbol">{stock.symbol}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-content">
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
