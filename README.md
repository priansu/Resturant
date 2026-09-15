# Sorella bookings

React customer site and owner dashboard backed by an Express API.

## Run in development

```powershell
npm install
npm run dev
```

Open `http://localhost:5173/` for the customer site and `http://localhost:5173/owner` for the owner dashboard.

The Vite frontend proxies `/api` requests to the Node server at `http://localhost:3001`. Reservations are saved in `data/bookings.json`, so the owner and customer can use different browsers or devices while the Node server is running.

## Run the production build

```powershell
npm run build
npm start
```

Open `http://localhost:3001/` and `http://localhost:3001/owner`.
