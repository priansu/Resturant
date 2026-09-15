import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(root, 'data');
const bookingsFile = path.join(dataDirectory, 'bookings.json');
const ordersFile = path.join(dataDirectory, 'orders.json');
const menuFile = path.join(dataDirectory, 'menu.json');
const categoriesFile = path.join(dataDirectory, 'categories.json');
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

async function readBookings() {
  try {
    return JSON.parse(await readFile(bookingsFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(bookingsFile, '[]');
    return [];
  }
}

async function writeBookings(bookings) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(bookingsFile, JSON.stringify(bookings, null, 2));
}

async function readOrders() {
  try {
    return JSON.parse(await readFile(ordersFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(ordersFile, '[]');
    return [];
  }
}

async function writeOrders(orders) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(ordersFile, JSON.stringify(orders, null, 2));
}

async function readMenu() {
  try {
    return JSON.parse(await readFile(menuFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(menuFile, '[]');
    return [];
  }
}

async function writeMenu(menu) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(menuFile, JSON.stringify(menu, null, 2));
}

async function readCategories() {
  try {
    return JSON.parse(await readFile(categoriesFile, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const categories = [...new Set((await readMenu()).map((dish) => dish.category))];
    await writeFile(categoriesFile, JSON.stringify(categories, null, 2));
    return categories;
  }
}

async function writeCategories(categories) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(categoriesFile, JSON.stringify(categories, null, 2));
}

app.get('/api/health', (_request, response) => response.json({ ok: true }));

app.get('/api/menu', async (_request, response, next) => {
  try {
    response.json(await readMenu());
  } catch (error) {
    next(error);
  }
});

app.get('/api/categories', async (_request, response, next) => {
  try {
    response.json(await readCategories());
  } catch (error) {
    next(error);
  }
});

app.post('/api/categories', async (request, response, next) => {
  try {
    const name = String(request.body.name || '').trim().toLowerCase().replace(/\s+/g, '-');
    if (!name || !/^[a-z0-9-]+$/.test(name)) {
      return response.status(400).json({ error: 'Use letters, numbers, spaces, or hyphens for a category.' });
    }
    const categories = await readCategories();
    if (categories.includes(name)) return response.status(409).json({ error: 'That category already exists.' });
    categories.push(name);
    await writeCategories(categories);
    response.status(201).json(name);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/categories/:name', async (request, response, next) => {
  try {
    const category = request.params.name;
    const menu = await readMenu();
    if (menu.some((dish) => dish.category === category)) {
      return response.status(409).json({ error: 'Remove or move the dishes in this category first.' });
    }
    const categories = await readCategories();
    if (!categories.includes(category)) return response.status(404).json({ error: 'Category not found.' });
    await writeCategories(categories.filter((item) => item !== category));
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/menu', async (request, response, next) => {
  try {
    const { category, name, description, price } = request.body;
    if (!name || !description || !price) {
      return response.status(400).json({ error: 'Category, dish name, description, and price are required.' });
    }
    if (!(await readCategories()).includes(category)) return response.status(400).json({ error: 'Choose an existing category.' });
    const dish = {
      id: randomUUID(),
      category,
      name: String(name).trim(),
      description: String(description).trim(),
      price: String(price).trim().startsWith('$') ? String(price).trim() : `$${String(price).trim()}`
    };
    const menu = await readMenu();
    menu.push(dish);
    await writeMenu(menu);
    response.status(201).json(dish);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/menu/:id', async (request, response, next) => {
  try {
    const menu = await readMenu();
    const remaining = menu.filter((dish) => dish.id !== request.params.id);
    if (remaining.length === menu.length) return response.status(404).json({ error: 'Dish not found.' });
    await writeMenu(remaining);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get('/api/bookings', async (_request, response, next) => {
  try {
    response.json(await readBookings());
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders', async (_request, response, next) => {
  try {
    response.json(await readOrders());
  } catch (error) {
    next(error);
  }
});

app.get('/api/orders/:id', async (request, response, next) => {
  try {
    const order = (await readOrders()).find((item) => item.id === request.params.id);
    if (!order) return response.status(404).json({ error: 'Order not found.' });
    response.json(order);
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', async (request, response, next) => {
  try {
    const { customerName, email, phone, guests, orderType, date, time, items } = request.body;
    if (!customerName || !['Takeaway', 'Dine in', 'Online'].includes(orderType) || !Array.isArray(items) || !items.length || (orderType === 'Dine in' && (!date || !time))) {
      return response.status(400).json({ error: 'Name, order type, and at least one dish are required.' });
    }
    const menu = await readMenu();
    const orderItems = items.map((item) => {
      const dish = menu.find((menuItem) => menuItem.id === item.id);
      const quantity = Math.max(1, Math.min(20, Number(item.quantity) || 0));
      if (!dish || !quantity) throw new Error('One of the selected dishes is no longer available.');
      return { id: dish.id, name: dish.name, price: dish.price, quantity };
    });
    const total = orderItems.reduce((sum, item) => sum + Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity, 0);
    const order = {
      id: randomUUID(),
      customerName: String(customerName).trim(),
      guests: guests ? String(guests) : '',
      email: email ? String(email).trim() : '',
      phone: phone ? String(phone).trim() : '',
      orderType,
      items: orderItems,
      total: `$${total.toFixed(2)}`,
      status: orderType === 'Dine in' ? 'Awaiting reservation' : 'New',
      createdAt: new Date().toISOString()
    };
    const orders = await readOrders();
    orders.unshift(order);
    if (orderType === 'Dine in') {
      const bookings = await readBookings();
      const booking = {
        id: randomUUID(),
        orderId: order.id,
        name: order.customerName,
        email: order.email,
        phone: order.phone,
        guests: guests ? String(guests) : 'Order guest',
        date: String(date),
        time: String(time),
        status: 'Pending',
        source: 'Dine-in order',
        createdAt: new Date().toISOString()
      };
      order.bookingId = booking.id;
      bookings.unshift(booking);
      await writeBookings(bookings);
    }
    await writeOrders(orders);
    response.status(201).json(order);
  } catch (error) {
    if (error.message.includes('selected dishes')) return response.status(400).json({ error: error.message });
    next(error);
  }
});

app.patch('/api/orders/:id', async (request, response, next) => {
  try {
    const { status } = request.body;
    if (!['Preparing', 'Ready', 'Completed', 'Rejected'].includes(status)) {
      return response.status(400).json({ error: 'Invalid order status.' });
    }
    const orders = await readOrders();
    const order = orders.find((item) => item.id === request.params.id);
    if (!order) return response.status(404).json({ error: 'Order not found.' });
    if (order.status === 'Awaiting reservation') return response.status(409).json({ error: 'Approve the dine-in reservation before preparing this order.' });
    order.status = status;
    order.updatedAt = new Date().toISOString();
    await writeOrders(orders);
    response.json(order);
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders/:id/items', async (request, response, next) => {
  try {
    const { dishId, quantity } = request.body;
    const orders = await readOrders();
    const order = orders.find((item) => item.id === request.params.id);
    if (!order) return response.status(404).json({ error: 'Order not found.' });
    if (order.orderType !== 'Dine in') return response.status(400).json({ error: 'Extra items can only be added to dine-in bills.' });
    const dish = (await readMenu()).find((item) => item.id === dishId);
    if (!dish) return response.status(404).json({ error: 'Dish not found.' });
    const amount = Math.max(1, Math.min(20, Number(quantity) || 0));
    const existing = order.items.find((item) => item.id === dish.id);
    if (existing) existing.quantity += amount;
    else order.items.push({ id: dish.id, name: dish.name, price: dish.price, quantity: amount });
    const total = order.items.reduce((sum, item) => sum + Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity, 0);
    order.total = `$${total.toFixed(2)}`;
    order.updatedAt = new Date().toISOString();
    await writeOrders(orders);
    response.json(order);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/orders/:id', async (request, response, next) => {
  try {
    const orders = await readOrders();
    const remaining = orders.filter((order) => order.id !== request.params.id);
    if (remaining.length === orders.length) return response.status(404).json({ error: 'Order not found.' });
    await writeOrders(remaining);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.post('/api/bookings', async (request, response, next) => {
  try {
    const { name, email, phone, guests, date, time } = request.body;
    if (!name || !guests || !date || !time) {
      return response.status(400).json({ error: 'Name, guests, date, and time are required.' });
    }
    const booking = {
      id: randomUUID(),
      name: String(name).trim(),
      email: email ? String(email).trim() : '',
      phone: phone ? String(phone).trim() : '',
      guests: String(guests),
      date: String(date),
      time: String(time),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    const bookings = await readBookings();
    bookings.unshift(booking);
    await writeBookings(bookings);
    response.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

app.patch('/api/bookings/:id', async (request, response, next) => {
  try {
    const { status } = request.body;
    if (!['Confirmed', 'Rejected'].includes(status)) {
      return response.status(400).json({ error: 'Status must be Confirmed or Rejected.' });
    }
    const bookings = await readBookings();
    const booking = bookings.find((item) => item.id === request.params.id);
    if (!booking) return response.status(404).json({ error: 'Booking not found.' });
    booking.status = status;
    booking.updatedAt = new Date().toISOString();
    if (booking.orderId) {
      const orders = await readOrders();
      const orderIndex = orders.findIndex((item) => item.id === booking.orderId);
      if (orderIndex !== -1) {
        if (status === 'Rejected') orders.splice(orderIndex, 1);
        else orders[orderIndex].status = 'New';
        await writeOrders(orders);
      }
    }
    await writeBookings(bookings);
    response.json(booking);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/bookings/:id', async (request, response, next) => {
  try {
    const bookings = await readBookings();
    const booking = bookings.find((item) => item.id === request.params.id);
    const remaining = bookings.filter((item) => item.id !== request.params.id);
    if (remaining.length === bookings.length) return response.status(404).json({ error: 'Booking not found.' });
    if (booking.orderId) await writeOrders((await readOrders()).filter((item) => item.id !== booking.orderId));
    await writeBookings(remaining);
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use(express.static(path.join(root, 'dist')));
app.use((request, response, next) => {
  if (request.method === 'GET' && !request.path.startsWith('/api/')) {
    return response.sendFile(path.join(root, 'dist', 'index.html'));
  }
  next();
});
app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(port, () => console.log(`Sorella API listening on http://localhost:${port}`));
