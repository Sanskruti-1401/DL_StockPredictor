/**
 * API Endpoint Definitions
 */

import { apiClient } from './client';

// ======================
// Authentication Endpoints
// ======================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username?: string;
  password: string;
  full_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthResponse extends TokenResponse {
  user: User;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export const authEndpoints = {
  login: (data: LoginRequest) => apiClient.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterRequest) => apiClient.post<AuthResponse>('/auth/register', data),
  refresh: (refreshToken: string) =>
    apiClient.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }),
  getCurrentUser: () => apiClient.get<User>('/auth/me'),
  logout: () => apiClient.get('/auth/logout'),
};

// ======================
// Stock Endpoints
// ======================

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  market_cap?: number;
  pe_ratio?: number;
  dividend_yield?: number;
  beta?: number;
  created_at: string;
  updated_at: string;
}

export interface StockDetail extends Stock {
  current_price: number;
  price_change: number;
  price_change_percent: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  average_volume?: number;
  latest_prediction?: unknown;
  latest_news?: unknown[];
  risk_level?: string;
}

export interface PriceData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export const stockEndpoints = {
  listStocks: (skip: number = 0, limit: number = 20) =>
    apiClient.get<Stock[]>(`/stocks?skip=${skip}&limit=${limit}`),
  searchStocks: (query: string, limit: number = 10) =>
    apiClient.get<Stock[]>(`/stocks/search?q=${query}&limit=${limit}`),
  getStock: (stockId: number) => apiClient.get<StockDetail>(`/stocks/${stockId}`),
  getPriceHistory: (stockId: number, days: number = 365) =>
    apiClient.get<PriceData[]>(`/stocks/${stockId}/price-history?days=${days}`),
  getSectors: () => apiClient.get<{ sector: string }[]>('/stocks/sectors'),
};

// ======================
// Prediction Endpoints
// ======================

export interface Prediction {
  id: number;
  stock_id: number;
  prediction_date: string;
  predicted_price: number;
  price_confidence?: number;
  predicted_volatility?: number;
  price_change_percent?: number;
  recommendation: string;
  recommendation_confidence?: number;
  recommendation_reason?: string;
  rsi?: number;
  macd?: number;
  bollinger_bands_signal?: string;
  moving_average_50?: number;
  moving_average_200?: number;
  news_sentiment_score?: number;
  sentiment_impact?: number;
  market_correlation?: number;
  index_influence?: number;
  model_version?: string;
}

export interface PredictionDetail extends Prediction {
  stock_symbol: string;
  current_price: number;
  target_date: string;
  days_to_target: number;
  price_upside: number;
  risk_reward_ratio: number;
}

export const predictionEndpoints = {
  getLatestPrediction: (stockId: number) =>
    apiClient.get<Prediction>(`/predictions/${stockId}`),
  getPredictionDetail: (stockId: number) =>
    apiClient.get<PredictionDetail>(`/predictions/${stockId}/detail`),
  getPredictionHistory: (stockId: number, limit: number = 30) =>
    apiClient.get<Prediction[]>(`/predictions/${stockId}/history?limit=${limit}`),
};

// ======================
// Risk Endpoints
// ======================

export interface RiskMetric {
  id: number;
  stock_id: number;
  date: string;
  volatility: number;
  beta?: number;
  value_at_risk?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  return_1_month?: number;
  return_3_month?: number;
  return_6_month?: number;
  return_1_year?: number;
  risk_level: string;
  risk_score: number;
}

export interface RiskDashboard {
  stock_symbol: string;
  current_price: number;
  risk_level: string;
  risk_score: number;
  key_metrics: Record<string, number | null>;
  alerts: string[];
  recommendations: string[];
}

export interface StressTest {
  stock_symbol: string;
  base_scenario: { price: number; return: number; description: string };
  bull_case: { price: number; return: number; description: string };
  bear_case: { price: number; return: number; description: string };
  extreme_case: { price: number; return: number; description: string };
}

export const riskEndpoints = {
  getStockRisk: (stockId: number) => apiClient.get<RiskMetric>(`/risks/stocks/${stockId}`),
  getRiskDashboard: (stockId: number) =>
    apiClient.get<RiskDashboard>(`/risks/stocks/${stockId}/dashboard`),
  getRiskHistory: (stockId: number, days: number = 90) =>
    apiClient.get<unknown>(`/risks/stocks/${stockId}/history?days=${days}`),
  getStressTest: (stockId: number) =>
    apiClient.get<StressTest>(`/risks/stocks/${stockId}/stress-test`),
  getRiskRanking: (limit: number = 20, sector?: string) => {
    const url = sector
      ? `/risks/ranking?limit=${limit}&sector=${sector}`
      : `/risks/ranking?limit=${limit}`;
    return apiClient.get<RiskMetric[]>(url);
  },
};

// ======================
// News Endpoints
// ======================

export interface NewsArticle {
  id: number;
  title: string;
  description?: string;
  source?: string;
  url?: string;
  sentiment: string;
  sentiment_score: number;
  confidence: number;
  published_date?: string;
  fetched_at: string;
}

export interface SentimentSummary {
  stock_symbol: string;
  stock_id: number;
  analysis_period_days: number;
  total_articles: number;
  average_sentiment: number;
  positive: number;
  negative: number;
  neutral: number;
  sentiment_trend: string;
  positive_percent: number;
  negative_percent: number;
}

export const newsEndpoints = {
  getStockNews: (stockId: number, limit: number = 20, days: number = 7, sentiment?: string) => {
    let url = `/news/stocks/${stockId}?limit=${limit}&days=${days}`;
    if (sentiment) url += `&sentiment=${sentiment}`;
    return apiClient.get<NewsArticle[]>(url);
  },
  getSentimentAnalysis: (stockId: number, days: number = 7) =>
    apiClient.get<SentimentSummary>(`/news/stocks/${stockId}/sentiment?days=${days}`),
  getSentimentTrending: (limit: number = 10, days: number = 7) =>
    apiClient.get<unknown>(`/news/sentiment-trending?limit=${limit}&days=${days}`),
  getSentimentComparison: (symbols: string[], days: number = 7) =>
    apiClient.get<unknown>(`/news/sentiment-comparison?symbols=${symbols.join(',')}&days=${days}`),
  getSentimentHistory: (stockId: number, days: number = 30) =>
    apiClient.get<unknown>(`/news/stocks/${stockId}/sentiment-history?days=${days}`),
};

// ======================
// Health Endpoints
// ======================

export const healthEndpoints = {
  check: () => apiClient.get('/health'),
  checkDb: () => apiClient.get('/health/db'),
};
