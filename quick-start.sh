#!/bin/bash

# Stock Predictor - Quick Start Commands
# Run these commands to setup and test the Polygon.io integration

API_BASE="http://localhost:8000/api/v1"
AUTH_TOKEN="${BEARER_TOKEN:-your_actual_token}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stock Predictor - Polygon.io Integration Quick Start${NC}\n"

# 1. Seed stocks
echo -e "${GREEN}1. Seeding 10 stocks...${NC}"
curl -X POST "$API_BASE/seed/stocks" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# 2. Get seed list
echo -e "${GREEN}2. Fetching seed list...${NC}"
curl -X GET "$API_BASE/seed/stocks/list" \
  -w "\nStatus: %{http_code}\n\n"

# 3. Full sync
echo -e "${GREEN}3. Starting full market data sync (10 stocks, 365 days)...${NC}"
curl -X POST "$API_BASE/refresh/full-sync" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbols": null,
    "days": 365
  }' \
  -w "\nStatus: %{http_code}\n\n"

# 4. Quick refresh
echo -e "${GREEN}4. Quick refresh latest prices...${NC}"
curl -X POST "$API_BASE/refresh/quick-refresh?symbols=AAPL&symbols=MSFT&symbols=GOOGL" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -w "\nStatus: %{http_code}\n\n"

# 5. List stocks (verify data)
echo -e "${GREEN}5. Listing all stocks...${NC}"
curl -X GET "$API_BASE/stocks?skip=0&limit=10" \
  -w "\nStatus: %{http_code}\n\n"

# 6. Get Polygon API endpoints documentation
echo -e "${GREEN}6. Fetching Polygon API endpoints documentation...${NC}"
curl -X GET "$API_BASE/refresh/api-endpoints" \
  -w "\nStatus: %{http_code}\n\n"

echo -e "${YELLOW}Quick Start Complete!${NC}"
echo -e "\nNext steps:"
echo -e "1. Check database: \`psql stock_predictor -c 'SELECT COUNT(*) FROM price_history;'\`"
echo -e "2. View frontend: http://localhost:3000"
echo -e "3. Check API docs: http://localhost:8000/api/docs"
