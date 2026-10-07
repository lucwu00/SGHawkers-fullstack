import { uploadsRouter } from "./routes/uploads.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import dotenv from "dotenv";
dotenv.config();

import { setupWebSocket } from "./websocket/wsManager.js";
import { requireCustomer, requireStaff } from "./middleware/auth.js";

import authRouter    from "./routes/auth.js";
import centresRouter from "./routes/centres.js";
import menuRouter    from "./routes/menu.js";
import ordersRouter  from "./routes/orders.js";
import { inventoryRouter, notificationsRouter, hawkerDataRouter, favouritesRouter } from "./routes/hawkerData.js";

const app    = express();
const server = createServer(app);
const PORT   = process.env.PORT || 4000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",   // customer dev
    "http://localhost:5174",   // hawker dev
    "http://localhost:3000",
    ...(process.env.ALLOWED_ORIGINS?.split(",") || []),
  ],
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({ windowMs: 15*60*1000, max: 300, standardHeaders: true });
app.use("/api/", limiter);

const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, message: { error: "Too many auth attempts" } });
app.use("/api/auth/", authLimiter);

// ─── ROUTES ───────────────────────────────────────────────────────────────────
app.use("/api/auth",            authRouter);
app.use("/api/centres",         centresRouter);
app.use("/api/menu",            menuRouter);
app.use("/api/orders",          ordersRouter);
app.use("/api/inventory",       inventoryRouter);
app.use("/api/notifications",   requireCustomer, notificationsRouter);
app.use("/api/favourites",      favouritesRouter);
app.use("/api/hawker",          hawkerDataRouter);
app.use("/api/uploads/menu", express.static("public/uploads/menu", {
  setHeaders: (res) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
  }
}));   
app.use("/api/uploads",          uploadsRouter);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status:"ok", ts:Date.now() }));

// ─── 404 + ERROR HANDLER ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));
app.use((err, req, res, next) => {
  console.error("Unhandled error", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── START ────────────────────────────────────────────────────────────────────
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`\n🍜 SGHawkers API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket ready at ws://localhost:${PORT}/ws`);
  console.log(`🗄  Database: ${process.env.DB_NAME || "sghawkers"} @ ${process.env.DB_HOST || "localhost"}`);
});
