# SGHawkers Backend

Express + PostgreSQL + WebSocket API connecting both the Customer and Hawker frontends.

---

## Folder Structure

```
SGHawkers-Backend/
├── src/
│   ├── server.js                  ← Entry point
│   ├── db/
│   │   ├── schema.sql             ← All table definitions (run first)
│   │   ├── seed.sql               ← Initial data (centres, stalls, staff)
│   │   └── pool.js                ← PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js                ← JWT auth (customer + staff + owner)
│   ├── websocket/
│   │   └── wsManager.js           ← WebSocket server + emit helpers
│   └── routes/
│       ├── auth.js                ← /api/auth — register, login, PIN login
│       ├── centres.js             ← /api/centres — centres + stalls
│       ├── menu.js                ← /api/menu — CRUD menu items
│       ├── orders.js              ← /api/orders — place + manage orders
│       └── hawkerData.js          ← /api/hawker + /api/inventory + /api/notifications + /api/favourites
├── shared/                        ← Copy these files into each frontend
│   ├── client.js                  → Both frontends: src/api/client.js
│   ├── useWebSocket.js            → Both frontends: src/hooks/useWebSocket.js
│   ├── useApi.customer.js         → Customer: src/hooks/useApi.js
│   └── useApi.hawker.js           → Hawker: src/hooks/useApi.js
├── .env.example                   ← Copy to .env and fill in values
└── package.json
```

---

## Step 1 — Install PostgreSQL

Download from https://www.postgresql.org/download/windows/
- Accept defaults during install
- Remember the password you set for the `postgres` user

---

## Step 2 — Create the database

Open **pgAdmin** (installed with PostgreSQL) or a terminal:

```bash
# In terminal (Command Prompt or PowerShell):
psql -U postgres -c "CREATE DATABASE sghawkers;"
psql -U postgres -d sghawkers -f src/db/schema.sql
psql -U postgres -d sghawkers -f src/db/seed.sql
```

Or use the npm script (after Step 3):
```bash
npm run db:setup
```

---

## Step 3 — Configure environment

```bash
# In the SGHawkers-Backend folder:
copy .env.example .env
```

Edit `.env`:
```
DB_PASSWORD=your_postgres_password_here
JWT_SECRET=any_long_random_string_here
```

---

## Step 4 — Install and run

```bash
npm install
npm run dev          # development (auto-restart on save)
# or
npm start            # production
```

Server starts at: http://localhost:4000
WebSocket at:     ws://localhost:4000/ws

---

## Step 5 — Configure both frontends

### In each Vite frontend, create a `.env` file:

**SGHawkers_Customer/.env**
```
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

**SGHawkers_Hawker/.env**
```
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000/ws
```

---

## Step 6 — Copy shared hooks into each frontend

From `SGHawkers-Backend/shared/`:

| File | Copy to Customer | Copy to Hawker |
|---|---|---|
| `client.js` | `src/api/client.js` | `src/api/client.js` |
| `useWebSocket.js` | `src/hooks/useWebSocket.js` | `src/hooks/useWebSocket.js` |
| `useApi.customer.js` | `src/hooks/useApi.js` | — |
| `useApi.hawker.js` | — | `src/hooks/useApi.js` |

Create the `src/api/` and `src/hooks/` folders in each frontend if they don't exist.

---

## Step 7 — Replace mock data imports in each frontend

### Customer side — change these imports:

```js
// BEFORE (in App.jsx and views):
import CENTRES from "./data/centres";
import STALLS  from "./data/stalls";
import { INIT_NOTIFS, PAST_ORDERS, HOT_DISHES } from "./data/constants";
import { favStalls, favItems } from ... // useState hard-coded

// AFTER:
import {
  useAuth, useCentres, useStalls, useStall,
  useOrders, useNotifications, useFavourites,
  usePopularDishes, useMenu
} from "./hooks/useApi";
```

### Hawker side — change these imports:

```js
// BEFORE:
import { INIT_ORDERS, INIT_MENU, INIT_ALERTS } from "./data/mockData";
import { INIT_INGREDIENTS, INIT_TRANSACTIONS } from "./data/inventoryData";
import { INIT_EXPENSES, INIT_WASTE_LOG, INIT_PROMOS } from "./data/phase34Data";

// AFTER:
import {
  useStaffAuth, useOrders, useMenu, useInventory,
  useTransactions, useExpenses, useWasteLog,
  usePromos, useAnalytics, useSettings, useStaffManagement
} from "./hooks/useApi";
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/customer/register | — | Register customer |
| POST | /api/auth/customer/login | — | Customer login |
| GET  | /api/auth/customer/me | Customer | Get own profile |
| POST | /api/auth/staff/login | — | Staff PIN login |
| GET  | /api/auth/staff/list/:stallId | — | List staff for PIN screen |

### Centres & Stalls
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/centres | — | All centres |
| GET | /api/centres/:slug/stalls | — | Stalls for a centre |
| GET | /api/centres/stall/:slug | — | Single stall + menu + reviews |

### Menu
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | /api/menu/:stallId | — | Get menu |
| GET    | /api/menu/popular/all | — | Hot dishes across all stalls |
| POST   | /api/menu/:stallId | Owner | Add item |
| PATCH  | /api/menu/:itemId | Staff | Update item (soldOut, portions, etc.) |
| DELETE | /api/menu/:itemId | Owner | Remove item |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST   | /api/orders | Customer | Place order |
| GET    | /api/orders/my | Customer | Own order history |
| GET    | /api/orders/stall/:stallId | Staff | Today's orders |
| PATCH  | /api/orders/:id/status | Staff | Advance status |
| POST   | /api/orders/:id/issue | Staff | Report issue + notify customer |

### WebSocket Events

| Event (server → client) | Who receives | Payload |
|---|---|---|
| `new_order` | Hawker dashboard | Full order object |
| `order_status_updated` | Hawker + Customer | Full order object |
| `menu_updated` | All customers + Hawker | Menu item object |
| `notification` | Customer | Notification object |
| `inventory_alert` | Hawker | Alert object |

---

## Test credentials (from seed.sql)

| Role | Login | Credential |
|---|---|---|
| Customer | demo@sghawkers.sg | demo1234 |
| Owner staff | (select from PIN screen) | 1111 |
| Cashier staff | (select from PIN screen) | 2222 |
| Kitchen staff | (select from PIN screen) | 3333 |

---

## Running all three together

Open 3 terminals:

```bash
# Terminal 1 — Backend
cd SGHawkers-Backend
npm run dev

# Terminal 2 — Customer
cd SGHawkers_Customer
npm run dev        # → http://localhost:5173

# Terminal 3 — Hawker
cd SGHawkers_Hawker
npm run dev        # → http://localhost:5174
```

Changes on the hawker side (soldOut, order status) appear on the customer side in real-time via WebSocket.
