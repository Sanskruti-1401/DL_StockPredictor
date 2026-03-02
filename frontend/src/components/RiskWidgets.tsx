/**
 * Risk Widgets Component
 * Displays risk metrics and alerts
 */

import React, { useEffect, useState } from 'react';
import { RiskDashboard, riskEndpoints } from '../api/endpoint';
import '../styles/risk.css';

interface RiskWidgetsProps {
  stockId: number;
  symbol: string;
}

export const RiskWidgets: React.FC<RiskWidgetsProps> = ({ stockId, symbol }: RiskWidgetsProps) => {
  const [riskData, setRiskData] = useState<RiskDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRiskData = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await riskEndpoints.getRiskDashboard(stockId);
        if (err) {
          setError(err);
        } else if (data) {
          setRiskData(data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRiskData();
  }, [stockId]);

  if (loading) return <div className="risk-loading">Loading risk metrics...</div>;
  if (error) return <div className="risk-error">Error: {error}</div>;
  if (!riskData) return <div className="risk-empty">No risk data available</div>;

  const getRiskColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'LOW':
        return 'risk-low';
      case 'MEDIUM':
        return 'risk-medium';
      case 'HIGH':
        return 'risk-high';
      case 'VERY_HIGH':
        return 'risk-very-high';
      default:
        return 'risk-neutral';
    }
  };

  return (
    <div className="risk-widgets">
      <div className="risk-header">
        <h3>{symbol} - Risk Dashboard</h3>
      </div>

      {/* Risk Score Card */}
      <div className={`risk-card risk-score-card ${getRiskColor(riskData.risk_level)}`}>
        <div className="risk-card-header">Risk Level</div>
        <div className="risk-score-display">
          <div className="score">{riskData.risk_score.toFixed(0)}</div>
          <div className="level">{riskData.risk_level}</div>
        </div>
        <div className="risk-bar">
          <div
            className="risk-bar-fill"
            style={{ width: `${Math.min(riskData.risk_score, 100)}%` }}
          />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="risk-metrics-grid">
        {riskData.key_metrics.volatility !== null && (
          <div className="metric-card">
            <div className="metric-label">Volatility</div>
            <div className="metric-value">
              {(riskData.key_metrics.volatility * 100).toFixed(2)}%
            </div>
            <div className="metric-description">Annual volatility</div>
          </div>
        )}

        {riskData.key_metrics.beta !== null && (
          <div className="metric-card">
            <div className="metric-label">Beta</div>
            <div className="metric-value">{riskData.key_metrics.beta.toFixed(2)}</div>
            <div className="metric-description">Market sensitivity</div>
          </div>
        )}

        {riskData.key_metrics.value_at_risk !== null && (
          <div className="metric-card">
            <div className="metric-label">Value at Risk</div>
            <div className="metric-value">
              {(riskData.key_metrics.value_at_risk * 100).toFixed(2)}%
            </div>
            <div className="metric-description">95% confidence</div>
          </div>
        )}

        {riskData.key_metrics.max_drawdown !== null && (
          <div className="metric-card">
            <div className="metric-label">Max Drawdown</div>
            <div className="metric-value">
              {(riskData.key_metrics.max_drawdown * 100).toFixed(2)}%
            </div>
            <div className="metric-description">Peak to trough</div>
          </div>
        )}

        {riskData.key_metrics.sharpe_ratio !== null && (
          <div className="metric-card">
            <div className="metric-label">Sharpe Ratio</div>
            <div className="metric-value">{riskData.key_metrics.sharpe_ratio.toFixed(2)}</div>
            <div className="metric-description">Risk-adjusted return</div>
          </div>
        )}
      </div>

      {/* Alerts Section */}
      {riskData.alerts && riskData.alerts.length > 0 && (
        <div className="risk-alerts">
          <h4>⚠️ Risk Alerts</h4>
          <ul className="alert-list">
            {riskData.alerts.map((alert: any, idx: number) => (
              <li key={idx} className="alert-item">
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations Section */}
      {riskData.recommendations && riskData.recommendations.length > 0 && (
        <div className="risk-recommendations">
          <h4>💡 Recommendations</h4>
          <ul className="recommendation-list">
            {riskData.recommendations.map((rec: any, idx: number) => (
              <li key={idx} className="recommendation-item">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="risk-disclaimer">
        <p>
          Risk metrics are calculated based on historical data. Past performance does not
          guarantee future results.
        </p>
      </div>
    </div>
  );
};
