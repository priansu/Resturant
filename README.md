# Sorella | Italian Kitchen

React/Vite customer and owner frontend deployed to Netlify, backed by an Express API and PostgreSQL on Render. The frontend never connects directly to the database.

## Local development

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `OWNER_EMAIL` and `OWNER_PASSWORD`.
3. Leave `DATABASE_URL` empty to use the checked-in JSON fallback, or set it to a local PostgreSQL connection string.
4. Run both applications with `npm run dev`.
5. Open `http://localhost:5173/` or `http://localhost:5173/owner`.

The Vite development server proxies `/api` to `http://localhost:3001`. In production, `VITE_API_URL` points to the Render API instead. The owner dashboard signs in through `/api/auth/login`; protected booking, menu, and order operations require its HttpOnly session cookie.

Useful standalone commands:

```powershell
npm run build
npm start
```

The standalone server is API-only. Check it with `GET http://localhost:3001/api/health`.

## Netlify deployment

1. Connect the GitHub repository to Netlify.
2. Set build command to `npm run build`.
3. Set publish directory to `dist`.
4. Set `VITE_API_URL` to the deployed Render service URL, for example `https://sorella-api.onrender.com`.
5. Deploy after the Render API is available, then set the Render `FRONTEND_URL` to the Netlify site URL.

`netlify.toml` provides the SPA fallback so `/owner` and `/bill/...` survive direct navigation and refresh.

## Render deployment

Use the included `render.yaml` as a Blueprint:

- Service type: Web Service
- Build command: `npm install`
- Start command: `npm start`
- Database: Render PostgreSQL, injected as `DATABASE_URL`

Set these backend environment variables in Render:

- `NODE_ENV=production`
- `OWNER_EMAIL` to the owner login email
- `OWNER_PASSWORD` to a strong password
- `FRONTEND_URL` to the exact Netlify origin, such as `https://sorella.netlify.app`
- `DATABASE_URL` is supplied by the Blueprint database connection

On startup, PostgreSQL tables are created from `schema.sql`. If the database tables are empty, the existing JSON files seed the initial menu and categories. With no `DATABASE_URL`, local development uses `data/*.json`.

## Architecture and deployment order

Customer and owner browsers load the React SPA from Netlify and call the Render Express API over HTTPS. Express validates owner sessions for protected endpoints, reads and writes through `db.js`, and uses PostgreSQL in production. No `VITE_*` variable contains a database credential or secret.

Deploy **Render first**, because Netlify needs the final API URL for `VITE_API_URL`. Then deploy Netlify and copy its final origin into Render's `FRONTEND_URL`. Redeploy the frontend if the Render URL was not known when its environment variables were configured.
