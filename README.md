# 📈 Stock Predictor

An AI-powered stock price prediction dashboard that combines machine learning, technical analysis, and real-time market data to help you make informed investment decisions.

## ✨ Features

- **AI Price Predictions**: ML-driven 24-hour price forecasts with confidence intervals
- **Technical Analysis**: RSI, volatility, momentum, and trend calculations
- **Real-time Market Data**: WebSocket-based live price updates
- **Sentiment Analysis**: Market sentiment tracking with news integration
- **Risk Assessment**: Portfolio risk metrics and recommendations
- **Interactive Dashboard**: Modern React UI with real-time charts and insights
- **Market Fundamentals**: P/E ratio, market cap, dividend yield display
- **Stock Recommendations**: BUY/SELL/HOLD recommendations based on multi-factor analysis

## 📸 Dashboard Preview

### Main Dashboard
![Dashboard Preview 1](docs/images/Screenshot%202026-03-09%20001709.png)
*AI prediction header with confidence gauge and real-time market data*

### Interactive Charts & Insights
![Dashboard Preview 2](docs/images/Screenshot%202026-03-09%20002046.png)
*Price history charts with technical analysis and market fundamentals*

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript + Vite
- **Chart.js** for interactive price visualizations
- **WebSocket** for real-time data streaming
- **Tailwind CSS** for responsive design

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **NumPy/SciPy** - ML and numerical computations
- **News API** - Real-time news sentiment analysis

### Machine Learning
- Trend analysis using polynomial regression
- Volatility modeling via historical returns
- RSI (Relative Strength Index) for momentum
- Confidence intervals based on forecast horizon

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd StockPredictor
```

2. **Set up backend**
```bash
cd backend
pip install -r requirements.txt
```

3. **Set up frontend**
```bash
cd frontend
npm install
```

### Configuration

Create a `.env` file in the backend directory:
```env
DATABASE_URL=sqlite:///./test.db
NEWS_API_KEY=your_newsapi_key_here
```

## 🎯 Running the Project

### Start Backend (Port 8000)
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend (Port 3000)
```bash
cd frontend
npm run dev
```

### Using Docker
```bash
docker-compose -f infra/docker-compose.yml up
```

The dashboard will be available at `http://localhost:3000`

## 🔌 API Endpoints

### Stocks
- `GET /api/v1/stocks` - List all stocks
- `GET /api/v1/stocks/{id}` - Get stock details
- `GET /api/v1/stocks/{id}/price-history` - Get historical prices (default 30 days)

### Predictions
- `GET /api/v1/predictions/{stock_id}` - Get 24-hour price prediction
- `GET /api/v1/predictions/batch/all` - Get predictions for all stocks

### Sentiment
- `GET /api/v1/sentiment/{stock_id}` - Get market sentiment data
- `GET /api/v1/sentiment/batch/all` - Get sentiment for all stocks

### Real-time
- `WS /ws/market-data/{stock_id}` - WebSocket stream for live price updates

## 📈 ML Prediction Model

The prediction engine uses:

1. **Historical Analysis** (30-day lookback)
   - Price trend calculation via linear regression
   - Volatility from historical returns standard deviation

2. **Technical Indicators**
   - RSI (Relative Strength Index) - momentum measurement
   - Momentum calculation - rate of price change

3. **Confidence Scoring**
   - Decreases with prediction horizon (higher confidence for near-term)
   - Based on volatility and trend strength
   - Ranges: 50% (uncertain) to 95% (confident)

4. **Price Bounds**
   - Upper/lower confidence intervals
   - Expands with increased volatility and forecast distance

## 🎓 Dashboard Components

### PredictionHeader
- AI prediction for next 24 hours
- Confidence gauge visualization
- Price change indicator ($ and %)

### HybridChart
- Interactive price history chart (30 days)
- Real-time price updates via WebSocket
- Prediction overlay with confidence intervals
- Technical stats footer (current price, volatility, etc.)

### InsightGrid
- Market fundamentals (P/E ratio, Market Cap, Dividend Yield)
- Technical analysis (RSI, volatility, momentum)
- News sentiment metrics

### Recommendations
- Buy/Sell/Hold signals with reasoning
- Confidence-weighted recommendations
- Sentiment-adjusted signals

## 🔐 Authentication

User authentication is implemented with:
- Email/password registration
- JWT-based session tokens
- Protected dashboard routes
- Demo user account for testing

## 🚧 Development

### Running Tests
```bash
cd backend
pytest tests/
```

### Database Migrations
```bash
cd backend
alembic upgrade head
```

## 📝 Example API Response

### Get Prediction
```json
{
  "status": "success",
  "stock_id": 1,
  "stock_symbol": "AAPL",
  "current_price": 185.50,
  "predictions": [
    {
      "hour": 1,
      "timestamp": "2026-03-09T12:00:00",
      "price": 186.23,
      "confidence": 0.93,
      "upper_bound": 187.45,
      "lower_bound": 185.01
    }
  ],
  "technical_analysis": {
    "trend": 1.24,
    "volatility": 2.15,
    "rsi": 62.5,
    "momentum": 0.85
  },
  "recommendation": "BUY"
}
```

## ⚙️ Configuration

### Backend Environment Variables
```env
DATABASE_URL=sqlite:///./test.db
NEWS_API_KEY=your_newsapi_key_here
POLYGON_API_KEY=your_key_here
DEBUG=False
LOG_LEVEL=info
```

### Frontend Environment Variables
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## 🐛 Troubleshooting

### Frontend not loading predictions
- Ensure backend is running on port 8000
- Check browser console for fetch errors
- Try hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Backend database errors
- Verify `backend/test.db` exists and has correct schema
- Check DATABASE_URL path is correct

### WebSocket connection issues
- Confirm backend WebSocket endpoint is accessible
- Check firewall/network settings
- Browser console will show connection errors

### Predictions showing "..." 
- Backend API may still be loading
- Check `/api/v1/predictions/{stock_id}` endpoint returns data

## 📈 Performance Metrics

- **Prediction Generation**: < 500ms per stock
- **API Response Time**: < 200ms average
- **WebSocket Update Frequency**: 1-5 second intervals
- **Dashboard Load Time**: < 2 seconds

## 📄 Resume Brief

> Copy-paste the blurb below directly into your resume or LinkedIn project section.

---

**AI-Powered Stock Price Predictor** | Python · FastAPI · React · TypeScript · WebSocket · SQLAlchemy · NumPy

Built a full-stack, real-time stock market dashboard that uses machine learning to generate 24-hour price forecasts with confidence intervals. The ML engine applies polynomial regression for trend analysis, historical-return volatility modeling, and RSI-based momentum scoring to produce BUY / SELL / HOLD recommendations. A WebSocket layer streams live price updates to a React + Chart.js frontend, while a FastAPI backend exposes a versioned REST API backed by SQLite. Additional features include JWT authentication, news sentiment analysis, and portfolio risk metrics.

**Key highlights:**
- Engineered an ML prediction pipeline (trend · volatility · RSI · momentum) generating sub-500 ms forecasts with dynamic confidence scoring (50%–95%)
- Designed and implemented 10+ REST endpoints and a WebSocket stream for real-time market data ingestion
- Built an interactive React dashboard with live charts, technical-analysis panels, and sentiment insight cards
- Containerized the full stack with Docker Compose for reproducible one-command deployment

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📧 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review API specs for endpoint details

---

**Last Updated**: March 9, 2026

Made for better investment decisions
