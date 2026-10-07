# Deploying SGHawkers

| Part | Where | Source |
|---|---|---|
| Backend (Express + WebSocket) + PostgreSQL | Railway | this repo, `SGHawkers_Backend` |
| Customer app | Vercel | this repo, `SGHawkers_Customer` |
| Hawker app | Vercel | `lucwu00/SGHawkers` |

## 1. Backend on Railway
1. New Project → Deploy from GitHub → `SGHawkers-fullstack`. Service **Settings → Root Directory**: `SGHawkers_Backend`.
2. In the same project: **Add → Database → PostgreSQL**.
3. Backend service **Variables**:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (reference to the Postgres service)
   - `JWT_SECRET` = any long random string
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGINS` = your two Vercel URLs, comma-separated (add after step 2/3 below)
4. **Networking → Generate Domain**. On first start the app creates all tables and loads the demo data automatically.

Demo logins: customer `demo@sghawkers.sg` / `demo1234`; hawker staff PINs `1111` (owner), `2222` (cashier), `3333` (kitchen).

## 2. Customer app on Vercel
Import `SGHawkers-fullstack`, Root Directory `SGHawkers_Customer`, then set:
```
VITE_API_URL   = https://<backend>.up.railway.app/api
VITE_WS_URL    = wss://<backend>.up.railway.app/ws
VITE_DEMO_MODE = false
```

## 3. Hawker app on Vercel
Import `lucwu00/SGHawkers`, then set:
```
VITE_API_URL   = https://<backend>.up.railway.app/api
VITE_WS_URL    = wss://<backend>.up.railway.app/ws
VITE_STALL_ID  = 4a6860aa-b3f8-410b-937a-a5052c30b276
VITE_DEMO_MODE = false
```

Finally put both Vercel URLs in the backend's `ALLOWED_ORIGINS` and redeploy the backend.
