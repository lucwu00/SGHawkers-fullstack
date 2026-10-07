import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { parse as parseUrl } from "url";

const JWT_SECRET = process.env.JWT_SECRET || "sghawkers-dev-secret-change-in-production";

// ─── CLIENT MAPS ──────────────────────────────────────────────────────────────
// stallId → Set of WebSocket clients (hawker dashboards)
const hawkerClients = new Map();

// customerId → WebSocket client (customer app)
const customerClients = new Map();

// ─── SETUP ────────────────────────────────────────────────────────────────────
export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const { query } = parseUrl(req.url, true);
    const token = query.token;

    if (!token) { ws.close(1008, "Token required"); return; }

    let payload;
    try { payload = jwt.verify(token, JWT_SECRET); }
    catch { ws.close(1008, "Invalid token"); return; }

    // Register client
    if (payload.type === "staff") {
      registerHawker(ws, payload.stallId);
    } else if (payload.type === "customer") {
      registerCustomer(ws, payload.id);
    }

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(ws, payload, msg);
      } catch { /* ignore malformed */ }
    });

    ws.on("close", () => cleanup(ws, payload));
    ws.on("error", (err) => { console.error("WS error", err); cleanup(ws, payload); });

    // Confirm connection
    safeSend(ws, { type: "connected", role: payload.type, ts: Date.now() });
  });

  console.log("WebSocket server ready at /ws");
  return wss;
}

// ─── REGISTRATION ─────────────────────────────────────────────────────────────
function registerHawker(ws, stallId) {
  if (!hawkerClients.has(stallId)) hawkerClients.set(stallId, new Set());
  hawkerClients.get(stallId).add(ws);
  ws._stallId = stallId;
  ws._type = "staff";
}

function registerCustomer(ws, customerId) {
  customerClients.set(customerId, ws);
  ws._customerId = customerId;
  ws._type = "customer";
}

function cleanup(ws, payload) {
  if (payload.type === "staff" && ws._stallId) {
    const set = hawkerClients.get(ws._stallId);
    if (set) { set.delete(ws); if (set.size === 0) hawkerClients.delete(ws._stallId); }
  } else if (payload.type === "customer" && ws._customerId) {
    customerClients.delete(ws._customerId);
  }
}

// ─── MESSAGE HANDLER ──────────────────────────────────────────────────────────
function handleMessage(ws, payload, msg) {
  // Ping/pong keepalive
  if (msg.type === "ping") safeSend(ws, { type: "pong", ts: Date.now() });
}

// ─── EMIT HELPERS (called by route handlers) ──────────────────────────────────

// New order → notify hawker dashboard
export function emitNewOrder(stallId, order) {
  broadcastToStall(stallId, { type: "new_order", order });
}

// Order status changed → notify customer + hawker
export function emitOrderStatusUpdate(stallId, customerId, order) {
  broadcastToStall(stallId, { type: "order_status_updated", order });
  if (customerId) {
    const customerWs = customerClients.get(customerId);
    if (customerWs) safeSend(customerWs, { type: "order_status_updated", order });
  }
}

// Menu item updated (soldOut, stock) → notify ALL customer clients watching this stall
export function emitMenuUpdate(stallId, item) {
  broadcastToStall(stallId, { type: "menu_updated", item });
  // Broadcast to all customers (they can filter by stall)
  broadcastToAllCustomers({ type: "menu_updated", stallId, item });
}

// Customer notification
export function emitCustomerNotification(customerId, notification) {
  const ws = customerClients.get(customerId);
  if (ws) safeSend(ws, { type: "notification", notification });
}

// Inventory alert → hawker only
export function emitInventoryAlert(stallId, alert) {
  broadcastToStall(stallId, { type: "inventory_alert", alert });
}

// ─── BROADCAST HELPERS ────────────────────────────────────────────────────────
function broadcastToStall(stallId, payload) {
  const clients = hawkerClients.get(stallId);
  if (!clients) return;
  const msg = JSON.stringify(payload);
  clients.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

function broadcastToAllCustomers(payload) {
  const msg = JSON.stringify(payload);
  customerClients.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

function safeSend(ws, payload) {
  if (ws.readyState === 1) ws.send(JSON.stringify(payload));
}

export { hawkerClients, customerClients };
