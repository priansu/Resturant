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

Important: the current app stores bookings, orders, menu items, and categories in local JSON files. Render's free service has ephemeral storage, so those files can be reset on a restart or redeploy. For real production use, move this data to a hosted database such as PostgreSQL/Supabase and add owner authentication before sharing the owner URL publicly.
