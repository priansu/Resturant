import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Pool } = pg;
const root = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(root, 'data');
const files = {
  bookings: path.join(dataDirectory, 'bookings.json'),
  orders: path.join(dataDirectory, 'orders.json'),
  menu: path.join(dataDirectory, 'menu.json'),
  categories: path.join(dataDirectory, 'categories.json')
};
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

async function jsonRead(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(file, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

async function jsonWrite(file, value) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}

export const usingDatabase = Boolean(pool);

export async function initializeDatabase() {
  if (!pool) return;
  const schema = await readFile(path.join(root, 'schema.sql'), 'utf8');
  await pool.query(schema);
  const [{ rows: categoryRows }, { rows: menuRows }, { rows: bookingRows }, { rows: orderRows }] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM categories'),
    pool.query('SELECT COUNT(*)::int AS count FROM menu_items'),
    pool.query('SELECT COUNT(*)::int AS count FROM bookings'),
    pool.query('SELECT COUNT(*)::int AS count FROM orders')
  ]);
  if (categoryRows[0].count === 0) await writeCategories(await jsonRead(files.categories, []));
  if (menuRows[0].count === 0) await writeMenu(await jsonRead(files.menu, []));
  if (bookingRows[0].count === 0) await writeBookings(await jsonRead(files.bookings, []));
  if (orderRows[0].count === 0) await writeOrders(await jsonRead(files.orders, []));
}

export async function readCategories() {
  if (!pool) return jsonRead(files.categories, []);
  const result = await pool.query('SELECT name FROM categories ORDER BY name');
  return result.rows.map((row) => row.name);
}

export async function writeCategories(categories) {
  if (!pool) return jsonWrite(files.categories, categories);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM categories');
    for (const category of categories) await client.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT DO NOTHING', [category]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function readMenu() {
  if (!pool) return jsonRead(files.menu, []);
  const result = await pool.query('SELECT id, category, name, description, price FROM menu_items ORDER BY name');
  return result.rows;
}

export async function writeMenu(menu) {
  if (!pool) return jsonWrite(files.menu, menu);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM menu_items');
    for (const dish of menu) await client.query('INSERT INTO menu_items (id, category, name, description, price) VALUES ($1, $2, $3, $4, $5)', [dish.id, dish.category, dish.name, dish.description, dish.price]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function mapBooking(row) {
  return { id: row.id, orderId: row.order_id, name: row.name, email: row.email, phone: row.phone, guests: row.guests, date: row.date, time: row.time, status: row.status, source: row.source, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function readBookings() {
  if (!pool) return jsonRead(files.bookings, []);
  const result = await pool.query('SELECT * FROM bookings ORDER BY created_at DESC');
  return result.rows.map(mapBooking);
}

export async function writeBookings(bookings) {
  if (!pool) return jsonWrite(files.bookings, bookings);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM bookings');
    for (const booking of bookings) await client.query('INSERT INTO bookings (id, order_id, name, email, phone, guests, date, time, status, source, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)', [booking.id, booking.orderId || null, booking.name, booking.email || '', booking.phone || '', booking.guests, booking.date, booking.time, booking.status, booking.source || null, booking.createdAt, booking.updatedAt || null]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function mapOrder(row) {
  return { id: row.id, customerName: row.customer_name, email: row.email, phone: row.phone, guests: row.guests, orderType: row.order_type, items: row.items, total: row.total, status: row.status, bookingId: row.booking_id, createdAt: row.created_at, updatedAt: row.updated_at };
}

export async function readOrders() {
  if (!pool) return jsonRead(files.orders, []);
  const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  return result.rows.map(mapOrder);
}

export async function writeOrders(orders) {
  if (!pool) return jsonWrite(files.orders, orders);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM orders');
    for (const order of orders) await client.query('INSERT INTO orders (id, customer_name, email, phone, guests, order_type, items, total, status, booking_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12)', [order.id, order.customerName, order.email || '', order.phone || '', order.guests || '', order.orderType, JSON.stringify(order.items), order.total, order.status, order.bookingId || null, order.createdAt, order.updatedAt || null]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
