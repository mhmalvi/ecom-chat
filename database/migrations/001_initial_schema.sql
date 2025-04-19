-- Initial database schema for ai-chatbot-backend

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  api_key VARCHAR(100) NOT NULL UNIQUE,
  platform_type VARCHAR(50) DEFAULT 'woo',
  woo_key VARCHAR(255),
  woo_secret VARCHAR(255),
  shopify_token VARCHAR(255),
  bot_name VARCHAR(100) DEFAULT 'AI Assistant',
  welcome_message TEXT DEFAULT 'How can I help you today?',
  bot_tone VARCHAR(50) DEFAULT 'friendly',
  bot_language VARCHAR(10) DEFAULT 'en',
  bot_active BOOLEAN DEFAULT TRUE,
  primary_color VARCHAR(20) DEFAULT '#4F46E5',
  logo_url TEXT,
  theme VARCHAR(20) DEFAULT 'light',
  timezone VARCHAR(50) DEFAULT 'UTC',
  platform_connected BOOLEAN DEFAULT FALSE,
  plan VARCHAR(50) DEFAULT 'free',
  max_messages INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'customer',
  store_id UUID REFERENCES stores(id),
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for conversation history
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(100) NOT NULL,
  store_id UUID REFERENCES stores(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create index for faster message lookup
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_store ON messages(store_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);

-- Orders table to track orders created through the bot
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_order_id VARCHAR(100),
  store_id UUID REFERENCES stores(id),
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(100),
  platform VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  order_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster order lookup
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_session ON orders(session_id);

-- Insert a default test store for development
INSERT INTO stores (name, domain, api_key, platform_type)
VALUES ('Test Store', 'https://example.com', 'test_api_key_123', 'static')
ON CONFLICT DO NOTHING;

-- Create a trigger to update "updated_at" automatically
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stores_timestamp
BEFORE UPDATE ON stores
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_orders_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp(); 