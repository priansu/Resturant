import cors from 'cors';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.join(root, 'data');
const bookingsFile = path.join(dataDirectory, 'bookings.json');
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

app.get('/api/health', (_request, response) => response.json({ ok: true }));

app.get('/api/bookings', async (_request, response, next) => {
  try {
    response.json(await readBookings());
  } catch (error) {
    next(error);
  }
});

app.post('/api/bookings', async (request, response, next) => {
  try {
    const { name, guests, date, time } = request.body;
    if (!name || !guests || !date || !time) {
      return response.status(400).json({ error: 'Name, guests, date, and time are required.' });
    }
    const booking = {
      id: randomUUID(),
      name: String(name).trim(),
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
    await writeBookings(bookings);
    response.json(booking);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/bookings/:id', async (request, response, next) => {
  try {
    const bookings = await readBookings();
    const remaining = bookings.filter((item) => item.id !== request.params.id);
    if (remaining.length === bookings.length) return response.status(404).json({ error: 'Booking not found.' });
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
