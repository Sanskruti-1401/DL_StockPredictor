-- Table for storing stock information
CREATE TABLE stocks (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    company_name VARCHAR(100)
);

-- Table for storing daily price data of stocks
CREATE TABLE prices (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    stock_id INT,
    price_date DATE,
    closing_price DECIMAL(10,2),
    volume INT,
    FOREIGN KEY (stock_id) REFERENCES stocks(stock_id)
);

-- Sample INSERT statements
INSERT INTO stocks (symbol, company_name) VALUES ('AAPL', 'Apple Inc.');
INSERT INTO stocks (symbol, company_name) VALUES ('GOOGL', 'Alphabet Inc.');

INSERT INTO prices (stock_id, price_date, closing_price, volume)
VALUES (1, '2024-04-10', 172.25, 12500000);

-- Sample SELECT query to fetch latest price for each stock
SELECT s.symbol, s.company_name, p.price_date, p.closing_price
FROM stocks s
JOIN prices p ON s.stock_id = p.stock_id
WHERE p.price_date = (
    SELECT MAX(price_date) FROM prices WHERE stock_id = s.stock_id
);

-- Sample CRUD Queries
-- Update price
UPDATE prices SET closing_price = 180.00 WHERE price_id = 1;

-- Delete a stock
DELETE FROM stocks WHERE symbol = 'GOOGL';
