/**
 * Price Chart Component
 * Displays stock price history with interactive chart
 */

import { useEffect, useState } from 'react';
import { PriceData, stockEndpoints } from '../api/endpoint';
import '../styles/chart.css';

interface PriceChartProps {
  stockId: number;
  symbol: string;
  days?: number;
  height?: number;
}

export const PriceChart = ({
  stockId,
  symbol,
  days = 365,
  height = 400,
}: PriceChartProps): JSX.Element => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPriceData = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await stockEndpoints.getPriceHistory(stockId, days);
        if (err) {
          setError(err);
        } else if (data) {
          setPrices(data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadPriceData();
  }, [stockId, days]);

  if (loading) return <div className="chart-loading">Loading chart...</div>;
  if (error) return <div className="chart-error">Error: {error}</div>;
  if (!prices.length) return <div className="chart-empty">No price data available</div>;

  const minPrice = Math.min(...prices.map((p: PriceData) => p.low));
  const maxPrice = Math.max(...prices.map((p: PriceData) => p.high));
  const range = maxPrice - minPrice || 1;
  const padding = 20;
  const chartWidth = 800;
  const chartHeight = height;

  const xScale = (chartWidth - padding * 2) / prices.length;
  const yScale = (chartHeight - padding * 2) / range;

  const points = prices.map((price: PriceData, idx: number) => ({
    x: padding + idx * xScale,
    y: chartHeight - padding - (price.close - minPrice) * yScale,
    price: price.close,
    date: price.date,
  }));

  const pathD = points.map((p: any, i: number) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const currentPrice = prices[prices.length - 1]?.close || 0;
  const previousPrice = prices[0]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);

  return (
    <div className="price-chart">
      <div className="chart-header">
        <h3>{symbol} Price Chart</h3>
        <div className="chart-stats">
          <span className="stat">
            Current: ${currentPrice.toFixed(2)}
          </span>
          <span className={`stat ${priceChange >= 0 ? 'positive' : 'negative'}`}>
            {priceChange >= 0 ? '+' : ''}
            {priceChangePercent}%
          </span>
        </div>
      </div>

      <svg
        className="chart-svg"
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height={height}
      >
        {/* Grid lines */}
        {Array.from({ length: 5 }).map((_: any, i: number) => {
          const y = padding + (i * (chartHeight - padding * 2)) / 4;
          const price = maxPrice - (i * range) / 4;
          return (
            <g key={`grid-${i}`}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} className="grid-line" />
              <text
                x={padding - 10}
                y={y}
                className="grid-label"
                textAnchor="end"
                alignmentBaseline="middle"
              >
                ${price.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Price line */}
        <path d={pathD} className="price-line" fill="none" stroke="#2563eb" strokeWidth="2" />

        {/* Fill under curve */}
        <path
          d={`${pathD} L ${chartWidth - padding} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
          className="price-fill"
          fill="url(#priceGradient)"
          opacity="0.1"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Current price marker */}
        <circle
          cx={points[points.length - 1]?.x}
          cy={points[points.length - 1]?.y}
          r="5"
          fill="#2563eb"
          className="price-marker"
        />
      </svg>

      <div className="chart-footer">
        <span className="date-range">
          {prices[0]?.date} to {prices[prices.length - 1]?.date}
        </span>
        <div className="chart-stats-footer">
          <span>High: ${Math.max(...prices.map((p: PriceData) => p.high)).toFixed(2)}</span>
          <span>Low: ${Math.min(...prices.map((p: PriceData) => p.low)).toFixed(2)}</span>
          <span>Avg Volume: {(prices.reduce((sum: number, p: PriceData) => sum + (p.volume || 0), 0) / prices.length).toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};
