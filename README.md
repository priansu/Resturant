# Sorella bookings

React customer site and owner dashboard backed by an Express API.

## Run in development

```powershell
npm install
npm run dev
```

Open `http://localhost:5173/` for the customer site and `http://localhost:5173/owner` for the owner dashboard.

The Vite frontend proxies `/api` requests to the Node server at `http://localhost:3001`. Reservations are saved in `data/bookings.json`, so the owner and customer can use different browsers or devices while the Node server is running.

The customer page also supports food orders. Email and phone are optional for reservations and orders; order type is required and can be `Takeaway`, `Dine in`, or `Online`. Orders are stored in `data/orders.json` and managed from the owner's Food orders inbox.

## Run the production build

```powershell
npm run build
npm start
```

Open `http://localhost:3001/` and `http://localhost:3001/owner`.

## Deploy on Render

1. Push this project to GitHub, including `render.yaml`.
2. In Render, choose **New +** -> **Blueprint**.
3. Select the GitHub repository and branch `fix/added_feature`.
4. Confirm the service settings from `render.yaml` and deploy.
5. Open the deployed URL for the customer site. Add `/owner` for the owner dashboard.

The service uses `npm install && npm run build` to build React and `npm start` to run Node.

The Render blueprint now creates a PostgreSQL database and injects its connection string as `DATABASE_URL`. On first startup, the app creates the SQL tables from `schema.sql` and seeds an empty database from the existing JSON files. Local development continues to use the JSON files when `DATABASE_URL` is not set.

Set `OWNER_EMAIL` and `OWNER_PASSWORD` in Render before deploying. The owner dashboard at `/owner` requires this login; booking lists and all menu/order management actions are protected by the session. Use `.env.example` as the local environment template.

When `DATABASE_URL` is configured, production data is stored in PostgreSQL instead of local JSON files. Add owner authentication before sharing the owner URL publicly.
