/**
 * Technical Indicators Panel Component
 */

import React from 'react';
import '../styles/indicators.css';

interface IndicatorData {
  rsi?: number;
  macd?: number;
  bollinger_bands_signal?: string;
  moving_average_50?: number;
  moving_average_200?: number;
  volatility?: number;
}

interface IndicatorPanelProps {
  indicators: IndicatorData;
  currentPrice: number;
  loading?: boolean;
}

export const IndicatorPanel: React.FC<IndicatorPanelProps> = ({
  indicators,
  currentPrice,
  loading = false,
}: IndicatorPanelProps) => {
  const getSignalColor = (value: number, min: number, max: number, reverse = false) => {
    const percentage = (value - min) / (max - min);
    if (reverse) {
      if (percentage > 0.7) return 'signal-sell';
      if (percentage > 0.3) return 'signal-neutral';
      return 'signal-buy';
    }
    if (percentage > 0.7) return 'signal-buy';
    if (percentage > 0.3) return 'signal-neutral';
    return 'signal-sell';
  };

  if (loading) {
    return <div className="indicators-loading">Loading indicators...</div>;
  }

  return (
    <div className="indicator-panel">
      <h3>Technical Indicators</h3>

      <div className="indicators-grid">
        {/* RSI Indicator */}
        {indicators.rsi !== undefined && (
          <div className="indicator-card">
            <div className="indicator-name">RSI (14)</div>
            <div className={`indicator-value ${getSignalColor(indicators.rsi, 0, 100, true)}`}>
              {indicators.rsi.toFixed(1)}
            </div>
            <div className="indicator-bar">
              <div className="bar-background">
                <div
                  className="bar-fill"
                  style={{ width: `${indicators.rsi}%` }}
                />
              </div>
              <div className="bar-zones">
                <span className="zone-label">Oversold</span>
                <span className="zone-label">Neutral</span>
                <span className="zone-label">Overbought</span>
              </div>
            </div>
            <div className="indicator-description">
              {indicators.rsi > 70
                ? 'Overbought - Potential sell signal'
                : indicators.rsi < 30
                  ? 'Oversold - Potential buy signal'
                  : 'Neutral - No clear signal'}
            </div>
          </div>
        )}

        {/* MACD Indicator */}
        {indicators.macd !== undefined && (
          <div className="indicator-card">
            <div className="indicator-name">MACD</div>
            <div className={`indicator-value ${indicators.macd > 0 ? 'signal-buy' : 'signal-sell'}`}>
              {indicators.macd.toFixed(4)}
            </div>
            <div className="indicator-description">
              {indicators.macd > 0 ? 'Bullish signal' : 'Bearish signal'}
            </div>
          </div>
        )}

        {/* Bollinger Bands Signal */}
        {indicators.bollinger_bands_signal && (
          <div className="indicator-card">
            <div className="indicator-name">Bollinger Bands</div>
            <div
              className={`indicator-value ${
                indicators.bollinger_bands_signal === 'UPPER'
                  ? 'signal-sell'
                  : indicators.bollinger_bands_signal === 'LOWER'
                    ? 'signal-buy'
                    : 'signal-neutral'
              }`}
            >
              {indicators.bollinger_bands_signal}
            </div>
            <div className="indicator-description">
              Price near{' '}
              {indicators.bollinger_bands_signal === 'UPPER'
                ? 'upper band - Overbought'
                : indicators.bollinger_bands_signal === 'LOWER'
                  ? 'lower band - Oversold'
                  : 'middle band - Neutral'}
            </div>
          </div>
        )}

        {/* Moving Average 50 */}
        {indicators.moving_average_50 !== undefined && (
          <div className="indicator-card">
            <div className="indicator-name">MA(50)</div>
            <div className="indicator-value">
              ${indicators.moving_average_50.toFixed(2)}
            </div>
            <div
              className={`indicator-comparison ${
                currentPrice > indicators.moving_average_50 ? 'signal-buy' : 'signal-sell'
              }`}
            >
              ${Math.abs(currentPrice - indicators.moving_average_50).toFixed(2)}
              {currentPrice > indicators.moving_average_50 ? ' above' : ' below'}
            </div>
          </div>
        )}

        {/* Moving Average 200 */}
        {indicators.moving_average_200 !== undefined && (
          <div className="indicator-card">
            <div className="indicator-name">MA(200)</div>
            <div className="indicator-value">
              ${indicators.moving_average_200.toFixed(2)}
            </div>
            <div
              className={`indicator-comparison ${
                currentPrice > indicators.moving_average_200 ? 'signal-buy' : 'signal-sell'
              }`}
            >
              ${Math.abs(currentPrice - indicators.moving_average_200).toFixed(2)}
              {currentPrice > indicators.moving_average_200 ? ' above' : ' below'}
            </div>
          </div>
        )}

        {/* Volatility */}
        {indicators.volatility !== undefined && (
          <div className="indicator-card">
            <div className="indicator-name">Volatility</div>
            <div className={`indicator-value ${getSignalColor(indicators.volatility * 100, 0, 100)}`}>
              {(indicators.volatility * 100).toFixed(2)}%
            </div>
            <div className="indicator-description">
              {indicators.volatility > 0.5
                ? 'High volatility - High risk'
                : indicators.volatility > 0.2
                  ? 'Moderate volatility'
                  : 'Low volatility'}
            </div>
          </div>
        )}
      </div>

      {/* Indicator Summary */}
      <div className="indicators-summary">
        <h4>Signal Summary</h4>
        <div className="summary-text">
          <p>
            Based on the technical indicators displayed above, use them to confirm entry and exit
            points in conjunction with other analysis methods.
          </p>
        </div>
      </div>
    </div>
  );
};
