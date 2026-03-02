/**
 * Risk Analysis Page Component
 */

import { useEffect, useState } from 'react';
import { riskEndpoints, RiskMetric } from '../api/endpoint';
import '../styles/risk-page.css';

export const Risk = () => {
  const [riskRanking, setRiskRanking] = useState<RiskMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedSector, setSelectedSector] = useState<string | undefined>();
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const loadRiskData = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await riskEndpoints.getRiskRanking(limit);
        if (err) {
          setError(err);
        } else if (data) {
          setRiskRanking(data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadRiskData();
  }, [limit]);

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

  if (loading) {
    return <div className="risk-page-loading">Loading risk analysis...</div>;
  }

  return (
    <div className="risk-page">
      <div className="risk-page-header">
        <h1>Risk Dashboard</h1>
        <p className="subtitle">Analyze and compare stock risk metrics</p>
      </div>

      <div className="risk-page-controls">
        <div className="control-group">
          <label>Results per page:</label>
          <select value={limit} onChange={(e: any) => setLimit(parseInt(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="risk-page-error">Error: {error}</div>
      ) : riskRanking.length === 0 ? (
        <div className="risk-page-empty">No risk data available</div>
      ) : (
        <div className="risk-ranking-table">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Company</th>
                <th>Sector</th>
                <th>Risk Level</th>
                <th>Risk Score</th>
                <th>Volatility</th>
                <th>Beta</th>
              </tr>
            </thead>
            <tbody>
              {riskRanking.map((stock: any) => (
                <tr key={stock.stock_id} className={`risk-row ${getRiskColor(stock.risk_level)}`}>
                  <td className="symbol">{stock.symbol}</td>
                  <td className="name">{stock.name}</td>
                  <td className="sector">{stock.sector || 'N/A'}</td>
                  <td className="risk-level">
                    <span className={`badge ${getRiskColor(stock.risk_level)}`}>
                      {stock.risk_level}
                    </span>
                  </td>
                  <td className="risk-score">
                    <div className="score-display">
                      <span className="score">{stock.risk_score.toFixed(0)}</span>
                      <div className="score-bar">
                        <div
                          className="score-bar-fill"
                          style={{ width: `${Math.min(stock.risk_score, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="volatility">
                    {(stock.volatility * 100).toFixed(2)}%
                  </td>
                  <td className="beta">{stock.beta?.toFixed(2) || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="risk-legend">
        <h3>Risk Levels</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color risk-low" />
            <span className="legend-label">Low Risk</span>
          </div>
          <div className="legend-item">
            <span className="legend-color risk-medium" />
            <span className="legend-label">Medium Risk</span>
          </div>
          <div className="legend-item">
            <span className="legend-color risk-high" />
            <span className="legend-label">High Risk</span>
          </div>
          <div className="legend-item">
            <span className="legend-color risk-very-high" />
            <span className="legend-label">Very High Risk</span>
          </div>
        </div>
      </div>

      <div className="risk-metrics-info">
        <h3>Risk Metrics Explained</h3>
        <div className="metrics-info-grid">
          <div className="metric-info">
            <h4>Risk Score</h4>
            <p>Overall risk assessment from 0-100. Higher values indicate higher risk.</p>
          </div>
          <div className="metric-info">
            <h4>Volatility</h4>
            <p>Standard deviation of returns. Measures how much the price fluctuates.</p>
          </div>
          <div className="metric-info">
            <h4>Beta</h4>
            <p>
              Measure of market sensitivity. Beta &gt; 1 means more volatile than market, &lt; 1
              means less volatile.
            </p>
          </div>
          <div className="metric-info">
            <h4>Risk Level</h4>
            <p>
              Categorical assessment: Low, Medium, High, or Very High based on multiple risk
              metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
