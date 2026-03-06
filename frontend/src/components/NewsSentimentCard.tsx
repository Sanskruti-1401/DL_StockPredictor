/**
 * News Sentiment Card Component
 */

import React, { useEffect, useState } from 'react';
import { NewsArticle, SentimentSummary, newsEndpoints } from '../api/endpoint';
import '../styles/news.css';

interface NewsSentimentCardProps {
  stockId: number;
  symbol: string;
  days?: number;
}

export const NewsSentimentCard: React.FC<NewsSentimentCardProps> = ({
  stockId,
  symbol,
  days = 7,
}: NewsSentimentCardProps) => {
  const [sentiment, setSentiment] = useState<SentimentSummary | null>(null);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSentimentData = async () => {
      try {
        setLoading(true);
        const [sentimentRes, articlesRes] = await Promise.all([
          newsEndpoints.getSentimentAnalysis(stockId, days),
          newsEndpoints.getStockNews(stockId, 8, days),
        ]);

        if (sentimentRes.error) {
          setError(sentimentRes.error);
        } else if (sentimentRes.data) {
          setSentiment(sentimentRes.data);
        }

        if (articlesRes.data) {
          setArticles(articlesRes.data);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSentimentData();
  }, [stockId, days]);

  const getSentimentColor = (sentiment: string | number) => {
    if (typeof sentiment === 'string') {
      switch (sentiment.toUpperCase()) {
        case 'POSITIVE':
          return 'sentiment-positive';
        case 'NEGATIVE':
          return 'sentiment-negative';
        default:
          return 'sentiment-neutral';
      }
    }

    // For numeric values
    if (sentiment > 0.2) return 'sentiment-positive';
    if (sentiment < -0.2) return 'sentiment-negative';
    return 'sentiment-neutral';
  };

  if (loading) return <div className="news-loading">Loading sentiment analysis...</div>;
  if (error) return <div className="news-error">Error: {error}</div>;
  if (!sentiment) return <div className="news-empty">No sentiment data available</div>;

  return (
    <div className="news-sentiment-card">
      <div className="news-header">
        <h3>{symbol} - News Sentiment</h3>
        <span className="sentiment-period">{days} days analysis</span>
      </div>

      {/* Sentiment Summary */}
      <div className="sentiment-summary">
        <div className={`sentiment-gauge ${getSentimentColor(sentiment?.sentiment_trend)}`}>
          <div className="sentiment-trend">{sentiment?.sentiment_trend ?? 'N/A'}</div>
          <div className="sentiment-score">
            {(sentiment?.average_sentiment ?? 0) > 0 ? '+' : ''}
            {(sentiment?.average_sentiment ?? 0).toFixed(2)}
          </div>
        </div>

        <div className="sentiment-stats">
          <div className="stat">
            <span className="label">Total Articles</span>
            <span className="value">{sentiment?.total_articles ?? 0}</span>
          </div>
          <div className="stat positive">
            <span className="label">Positive</span>
            <span className="value">{(sentiment?.positive_percent ?? 0).toFixed(0)}%</span>
          </div>
          <div className="stat negative">
            <span className="label">Negative</span>
            <span className="value">{(sentiment?.negative_percent ?? 0).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="sentiment-distribution">
        <div className="distribution-bar">
          {(sentiment?.positive ?? 0) > 0 && (
            <div
              className="distribution-segment positive"
              style={{
                width: `${((sentiment?.positive ?? 0) / (sentiment?.total_articles ?? 1)) * 100}%`,
              }}
              title={`Positive: ${sentiment?.positive ?? 0}`}
            />
          )}
          {(sentiment?.neutral ?? 0) > 0 && (
            <div
              className="distribution-segment neutral"
              style={{
                width: `${((sentiment?.neutral ?? 0) / (sentiment?.total_articles ?? 1)) * 100}%`,
              }}
              title={`Neutral: ${sentiment?.neutral ?? 0}`}
            />
          )}
          {(sentiment?.negative ?? 0) > 0 && (
            <div
              className="distribution-segment negative"
              style={{
                width: `${((sentiment?.negative ?? 0) / (sentiment?.total_articles ?? 1)) * 100}%`,
              }}
              title={`Negative: ${sentiment?.negative ?? 0}`}
            />
          )}
        </div>
      </div>

      {/* Recent Articles */}
      {articles.length > 0 && (
        <div className="recent-articles">
          <h4>Recent News</h4>
          <div className="articles-list">
            {articles.slice(0, 5).map((article: any) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`article-item ${getSentimentColor(article.sentiment)}`}
              >
                <div className="article-sentiment-badge">{article.sentiment}</div>
                <div className="article-title">{article.title}</div>
                <div className="article-meta">
                  <span className="article-source">{article.source}</span>
                  <span className="article-score">
                    {article.sentiment_score > 0 ? '+' : ''}
                    {article.sentiment_score.toFixed(2)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="news-disclaimer">
        <p>
          Sentiment analysis is based on news articles and social media. It may not reflect the
          most current market conditions.
        </p>
      </div>
    </div>
  );
};
