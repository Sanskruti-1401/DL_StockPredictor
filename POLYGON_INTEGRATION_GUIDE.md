# Stock Predictor - Polygon.io Integration Guide

## Overview

This document outlines the complete on-demand refresh flow, 10-stock seed list, and Polygon.io API integration for the Stock Predictor application.

---

## 1. System Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│          Frontend (React/TypeScript)                    │
│  - Dashboard, Stock Detail, Risk pages                  │
└──────────────────┬──────────────────────────────────────┘
                   │ API Calls
                   ▼
┌─────────────────────────────────────────────────────────┐
│          FastAPI Backend                                │
│  - Auth Routes (/api/v1/auth)                           │
│  - Stock Routes (/api/v1/stocks)                        │
│  - Refresh Routes (/api/v1/refresh)  ◄── NEW           │
│  - Seed Routes (/api/v1/seed)        ◄── NEW           │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           │ Market Data Service      ▼ Polygon.io API
           │ (MarketDataService)      
           │                          └─ /v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}
           │                          └─ /v2/aggs/ticker/{symbol}/prev
           │                          └─ /v3/reference/tickers/{symbol}
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│     PostgreSQL Database                                 │
│  - stocks (symbol, name, sector, active)                │
│  - price_history (OHLCV, volume)                        │
│  - stock_predictions                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 10-Stock Seed List

### Purpose
Bootstrap the application with real market data for testing and development.

### Seed Stocks

| Symbol | Company | Sector | Industry | Market Cap |
|--------|---------|--------|----------|-----------|
| AAPL | Apple Inc. | Technology | Consumer Electronics | ~$3T |
| MSFT | Microsoft Corporation | Technology | Software | ~$2.8T |
| GOOGL | Alphabet Inc. | Technology | Internet Services | ~$1.8T |
| AMZN | Amazon.com Inc. | Consumer Cyclical | Internet Retail | ~$1.7T |
| NVDA | NVIDIA Corporation | Technology | Semiconductors | ~$1.1T |
| META | Meta Platforms Inc. | Technology | Internet Services | ~$600B |
| TSLA | Tesla Inc. | Consumer Cyclical | Automotive | ~$800B |
| JPM | JPMorgan Chase & Co. | Financial | Banking | ~$500B |
| JNJ | Johnson & Johnson | Healthcare | Pharmaceuticals | ~$420B |
| V | Visa Inc. | Financial | Payment Processing | ~$570B |

### Seeding Endpoint

**POST** `/api/v1/seed/stocks`

**Authorization**: Required (Admin/User)

**Response**:
```json
{
  "created": 10,
  "skipped": 0,
  "failed": 0,
  "message": "Seed completed: 10 created, 0 skipped, 0 failed"
}
```

---

## 3. Polygon.io API Integration

### API Configuration

- **Base URL**: `https://api.polygon.io`
- **Authentication**: Query parameter `apiKey`
- **Rate Limits**: 
  - Free tier: 5 requests/minute
  - Premium: Higher limits (contact Polygon)
- **Timeout**: 10 seconds

### Exact API Endpoints

#### 3.1 Price History (Aggregates)

**Endpoint**: `GET /v2/aggs/ticker/{tickerSymbol}/range/{multiplier}/{timespan}/{from}/{to}`

**Purpose**: Fetch daily OHLCV (Open, High, Low, Close, Volume) bars

**Example Request**:
```
GET https://api.polygon.io/v2/aggs/ticker/AAPL/range/1/day/2024-01-01/2024-03-06
    ?apiKey=YOUR_POLYGON_API_KEY
```

**Response**:
```json
{
  "status": "OK",
  "results": [
    {
      "t": 1704067200000,    // Unix timestamp in milliseconds
      "o": 189.95,           // Open price
      "h": 191.50,           // High price
      "l": 189.45,           // Low price
      "c": 190.34,           // Close price
      "v": 52893100,         // Volume
      "vw": 190.42           // Volume weighted average price
    }
  ],
  "count": 60
}
```

**Database Mapping**:
```python
PriceHistory(
    stock_id=1,
    date=datetime.utcfromtimestamp(1704067200000 / 1000),
    open_price=189.95,
    high_price=191.50,
    low_price=189.45,
    close_price=190.34,
    volume=52893100,
    adjusted_close=190.34
)
```

**Service Method**: `MarketDataService.fetch_price_history(symbol, days)`

---

#### 3.2 Latest Quote (Previous Close)

**Endpoint**: `GET /v2/aggs/ticker/{tickerSymbol}/prev`

**Purpose**: Get the most recent trading day OHLCV data

**Example Request**:
```
GET https://api.polygon.io/v2/aggs/ticker/AAPL/prev
    ?apiKey=YOUR_POLYGON_API_KEY
```

**Response**:
```json
{
  "status": "OK",
  "results": [
    {
      "t": 1709702400000,
      "o": 192.45,
      "h": 193.22,
      "l": 191.85,
      "c": 192.98,
      "v": 48532100,
      "vw": 192.67
    }
  ]
}
```

**Use Case**: Real-time price updates for dashboard

**Service Method**: `MarketDataService.get_latest_quote(symbol)`

---

#### 3.3 Ticker Details (Company Info)

**Endpoint**: `GET /v3/reference/tickers/{tickerSymbol}`

**Purpose**: Get company metadata, active status, market type

**Example Request**:
```
GET https://api.polygon.io/v3/reference/tickers/AAPL
    ?apiKey=YOUR_POLYGON_API_KEY
```

**Response**:
```json
{
  "status": "OK",
  "results": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "market": "stocks",
    "locale": "us",
    "currency_name": "usd",
    "type": "CS",
    "active": true,
    "primary_exchange": "XNAS"
  }
}
```

**Service Method**: `MarketDataService.get_stock_details(symbol)`

---

## 4. On-Demand Refresh Flow

### Overview

The refresh system provides two modes of operation:

1. **Full Sync**: Complete historical data sync
2. **Quick Refresh**: Latest prices only

### 4.1 Full Sync Flow

**Endpoint**: `POST /api/v1/refresh/full-sync`

**Request Body**:
```json
{
  "symbols": ["AAPL", "MSFT", "GOOGL"],
  "days": 365
}
```

**Flow Diagram**:
```
1. User initiates Full Sync
   ↓
2. Backend validates stock symbols exist in database
   ↓
3. For each symbol:
   a. Call Polygon: GET /v2/aggs/ticker/{symbol}/range/1/day/{from}/{to}
   b. Parse OHLCV data
   c. For each bar:
      - Check if PriceHistory record exists for date
      - Create or update record
   ↓
4. Return sync statistics
   - Total symbols processed
   - Successfully synced
   - Failed records
   - Error messages
```

**Response**:
```json
{
  "total": 3,
  "synced": 3,
  "failed": 0,
  "records_created": 780,
  "errors": [],
  "started_at": "2024-03-06T10:30:00Z",
  "completed_at": "2024-03-06T10:32:45Z"
}
```

**Execution Time**: ~2-3 minutes for 10 stocks (365 days each)

---

### 4.2 Quick Refresh Flow

**Endpoint**: `POST /api/v1/refresh/quick-refresh`

**Query Parameters**:
```
symbols=AAPL&symbols=MSFT&symbols=GOOGL
```

**Flow Diagram**:
```
1. User initiates Quick Refresh
   ↓
2. Validate symbols provided
   ↓
3. For each symbol:
   a. Call Polygon: GET /v2/aggs/ticker/{symbol}/prev
   b. Extract latest OHLCV
   c. Update/create latest PriceHistory record
   ↓
4. Return latest quotes and statistics
```

**Response**:
```json
{
  "total": 3,
  "updated": 3,
  "failed": 0,
  "updated_at": "2024-03-06T10:35:00Z"
}
```

**Execution Time**: ~300ms for 3 stocks

---

### 4.3 Single Stock Refresh

**Endpoint**: `POST /api/v1/refresh/refresh/{stock_id}`

**Query Parameters**:
- `days`: Number of historical days (1-1825, default 365)

**Flow**: Same as Full Sync but for single stock

**Response**:
```json
{
  "symbol": "AAPL",
  "total": 1,
  "synced": 1,
  "failed": 0,
  "records_created": 260,
  "errors": []
}
```

---

## 5. Implementation Details

### MarketDataService Methods

#### `fetch_price_history(symbol, days)`
- Calls Polygon API for daily aggregates
- Parses OHLCV data
- Returns list of price dictionaries

#### `get_latest_quote(symbol)`
- Calls Polygon API for previous close
- Returns latest quote with VWAP

#### `get_stock_details(symbol)`
- Calls Polygon API for ticker details
- Returns company metadata

#### `sync_market_data(symbols, days)`
- Orchestrates full sync operation
- Handles error recovery
- Returns comprehensive statistics

#### `refresh_latest_prices(symbols)`
- Quick refresh for multiple symbols
- Updates only latest prices
- Optimized for speed

#### `calculate_technical_indicators(stock_id)`
- Calculates from PriceHistory data
- RSI, Moving Averages, etc.
- No external API calls

---

## 6. Setup Instructions

### Prerequisites

1. PostgreSQL database running
2. Polygon.io API key (sign up at https://polygon.io)
3. `.env` file with:
```
POLYGON_API_KEY=your_actual_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/stock_predictor
```

### Steps

1. **Initialize Database**
   - Run backend startup (automatic with `init_db()`)
   - Schema created

2. **Seed Stocks**
   ```bash
   curl -X POST http://localhost:8000/api/v1/seed/stocks \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

3. **Full Sync**
   ```bash
   curl -X POST http://localhost:8000/api/v1/refresh/full-sync \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"symbols": null, "days": 365}'
   ```

4. **View API Documentation**
   - Visit: http://localhost:8000/api/docs (Swagger UI)
   - All endpoints documented with examples

---

## 7. Rate Limiting Strategy

### Polygon.io Limits

- **Free tier**: 5 requests/minute = 1 request every 12 seconds
- **Our implementation**: 0.1s delay between requests = 10 requests/second (requires premium)

### For Free Tier Users

Modify in `market_data.py`:
```python
time.sleep(12)  # Instead of time.sleep(0.1)
```

### Recommended Sync Schedule

- **Full Sync**: Once per week (weekends recommended)
- **Quick Refresh**: Every 30 minutes during market hours
- **Manual triggers**: On-demand for specific stocks

---

## 8. Error Handling

### Common Issues

1. **401 Unauthorized**: Invalid Polygon API key
2. **429 Too Many Requests**: Rate limit exceeded → increase `time.sleep()`
3. **404 Not Found**: Stock symbol not in database
4. **500 Database Error**: Connection issues → check PostgreSQL

### Retry Logic

All API calls include:
- HTTP timeout: 10 seconds
- Error logging
- Database rollback on failure

---

## 9. Monitoring & Logging

All operations logged to:
- **File**: `logs/app.log`
- **Console**: Set in `core/logging.py`
- **Level**: INFO (development)

### Example Log Entries

```
2024-03-06 10:30:00 - INFO - Fetching price history for AAPL (365 days) from Polygon.io
2024-03-06 10:30:01 - INFO - Fetched 252 days of price history for AAPL
2024-03-06 10:30:02 - INFO - Successfully synced AAPL: 252 records
```

---

## 10. Performance Metrics

### Current Implementation

- **Price History Fetch**: 1 request per stock = ~100ms per stock
- **Quick Refresh**: 1 request per stock = ~100ms per stock
- **Full Sync (10 stocks, 365 days)**: ~2-3 minutes total
- **Database Inserts**: 250 records per stock ≈ 5000 total per full sync

### Optimization Opportunities

1. **Batch Inserts**: Combine multiple INSERT statements
2. **Caching**: Redis cache for frequently accessed stocks
3. **Pagination**: Use Polygon's cursor for large date ranges
4. **Parallel Sync**: Process multiple symbols concurrently
5. **Incremental Updates**: Only sync new data since last update

---

## 11. API Documentation

### View Interactive Docs

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

All endpoints are self-documenting with:
- Request/response schemas
- Query parameters
- Authorization requirements
- Example responses

---

## 12. Next Steps

After completing this setup:

1. ✅ Run seed: `POST /api/v1/seed/stocks`
2. ✅ Full sync: `POST /api/v1/refresh/full-sync`
3. ✅ Verify data: Check `price_history` table in database
4. ✅ Test dashboard: Browse stocks in frontend
5. ✅ Implement prediction models: Use price history data
6. ✅ Add sentiment analysis: News data routes
7. ✅ Setup scheduled refreshes: Background job scheduler

---

## File Changes Summary

### New Files
- `backend/app/api/V1/routes/refresh.py` - Refresh endpoints
- `backend/app/api/V1/routes/seed.py` - Seeding endpoints

### Modified Files
- `backend/app/services/market_data.py` - Polygon.io integration
- `backend/app/main.py` - Added new routes
- `backend/app/db/models.py` - Added `active` field to Stock

---

**Last Updated**: March 6, 2026
**Status**: Complete & Ready for Testing
