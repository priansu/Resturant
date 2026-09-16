CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL REFERENCES categories(name) ON UPDATE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  guests TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  guests TEXT NOT NULL DEFAULT '',
  order_type TEXT NOT NULL,
  items JSONB NOT NULL,
  total TEXT NOT NULL,
  status TEXT NOT NULL,
  booking_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_booking_id_idx ON orders(booking_id);
