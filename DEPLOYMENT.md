# Himalaya Kitchen — Deployment Guide

## Architecture Overview

| Service | Platform | Directory |
|---------|----------|-----------|
| React/Vite frontend | Vercel | `client/` |
| Node.js/Express backend | Render (Web Service) | `server/` |
| Flask ML recommendations | Render (Web Service) | `ml/` — `app.py` |
| Flask Prophet forecasting | Render (Web Service) | `ml/` — `prophet_app.py` |
| Database | MongoDB Atlas | — |

---

## Step 1 — MongoDB Atlas

You already have an Atlas cluster. Get the connection string:

1. Go to [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Connect**
2. Choose **Connect your application** → Driver: Node.js
3. Copy the URI — it looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/restaurant-system?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual Atlas password.
5. Keep this string — you will paste it as `MONGO_URI` on Render.

---

## Step 2 — Deploy Backend to Render (Node.js)

### 2a. Create the Web Service

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Set the following:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

### 2b. Environment Variables for the Backend

Set these in Render → your service → **Environment**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string (e.g. 64 chars) |
| `JWT_REFRESH_SECRET` | A different long random string |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CLOUDINARY_CLOUD_NAME` | `dlwfzhmpw` |
| `CLOUDINARY_API_KEY` | `475127597586519` |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `ALLOWED_ORIGIN` | Your Vercel frontend URL (e.g. `https://himalaya-kitchen.vercel.app`) — **set this after deploying to Vercel** |
| `FLASK_URL` | Your Render ML recommendations service URL (e.g. `https://himalaya-kitchen-ml.onrender.com`) — **set after deploying ML** |
| `PROPHET_URL` | Your Render Prophet service URL (e.g. `https://himalaya-kitchen-prophet.onrender.com`) — **set after deploying Prophet** |
| `ADMIN_NAME` | `Admin` |
| `ADMIN_EMAIL` | Your admin email |
| `ADMIN_PASSWORD` | A strong admin password |

> After the service is live, note its URL (e.g. `https://himalaya-kitchen-backend.onrender.com`).
> You will need it for Vercel env vars.

### 2c. Seed the Admin User (once, after first deploy)

In Render → your service → **Shell** (or open Render's console), run:
```
node seeds/AdminSeed.js
```

---

## Step 3 — Deploy ML Services to Render (Flask)

You need **two separate Web Services** — both use the `ml/` directory.

### Service 1 — Apriori Recommendations (`app.py`)

1. Render → **New → Web Service** → connect repo
2. Settings:
   - **Root Directory:** `ml`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT app:app`
   - **Environment:** Python 3
3. No additional env vars needed.
4. Note the service URL (e.g. `https://himalaya-kitchen-ml.onrender.com`)
5. Paste this URL as `FLASK_URL` in the backend service env vars.

### Service 2 — Prophet Forecasting (`prophet_app.py`)

1. Render → **New → Web Service** → connect repo
2. Settings:
   - **Root Directory:** `ml`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT prophet_app:app`
   - **Environment:** Python 3
3. No additional env vars needed.
4. Note the service URL (e.g. `https://himalaya-kitchen-prophet.onrender.com`)
5. Paste this URL as `PROPHET_URL` in the backend service env vars.

---

## Step 4 — Deploy Frontend to Vercel (React/Vite)

### 4a. Create the Project

1. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo
2. Set the following:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 4b. Environment Variables for the Frontend

Set these in Vercel → your project → **Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your Render backend URL + `/api/v1` (e.g. `https://himalaya-kitchen-backend.onrender.com/api/v1`) |
| `VITE_SOCKET_URL` | Your Render backend URL without path (e.g. `https://himalaya-kitchen-backend.onrender.com`) |

> `VITE_` prefix is required — Vite only exposes env vars with this prefix to the browser bundle.

### 4c. After Deploy

1. Note your Vercel URL (e.g. `https://himalaya-kitchen.vercel.app`)
2. Go back to **Render → backend service → Environment**
3. Set `ALLOWED_ORIGIN` to that Vercel URL
4. Render will auto-redeploy. CORS will now accept requests from Vercel.

---

## Step 5 — Verify Everything Works

Check each service health endpoint:

```
GET https://himalaya-kitchen-backend.onrender.com/api/v1/test
GET https://himalaya-kitchen-ml.onrender.com/health
GET https://himalaya-kitchen-prophet.onrender.com/health
```

Then open your Vercel URL, log in with your admin credentials, and verify:
- Menu, tables, orders load
- Socket.io live updates work (kitchen display, cashier panel)
- Recommendations appear on the customer order page
- Forecast charts load on the admin analytics page

---

## Deployment Order Checklist

```
[ ] 1. MongoDB Atlas — get connection string
[ ] 2. Deploy Node backend to Render → note backend URL
[ ] 3. Deploy ML recommendations service to Render → note URL → set as FLASK_URL on backend
[ ] 4. Deploy Prophet forecasting service to Render → note URL → set as PROPHET_URL on backend
[ ] 5. Deploy React frontend to Vercel → set VITE_API_URL and VITE_SOCKET_URL → note Vercel URL
[ ] 6. Set ALLOWED_ORIGIN on Render backend = Vercel URL → trigger redeploy
[ ] 7. Run AdminSeed on Render backend console
[ ] 8. Smoke-test all health endpoints
[ ] 9. Log in and verify full app flow
```

---

## Notes

- **Free-tier cold starts:** Render free services spin down after inactivity. The first request after idle may take 30–60 seconds. Upgrade to a paid instance for production use.
- **Socket.io on Render:** Render's free tier supports WebSockets. If you upgrade and use multiple instances, you will need sticky sessions or a Redis adapter.
- **Cloudinary:** Images are served from Cloudinary CDN. No changes needed — keys are already in the backend env vars.
- **CORS cookies:** `withCredentials: true` is set on the frontend. Make sure your Vercel URL exactly matches `ALLOWED_ORIGIN` (no trailing slash).
