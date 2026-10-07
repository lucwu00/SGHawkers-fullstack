import { Router } from "express";
import bcrypt from "bcrypt";
import { query } from "../db/pool.js";
import { signCustomerToken, signStaffToken } from "../middleware/auth.js";

const router = Router();

// ─── CUSTOMER REGISTER ────────────────────────────────────────────────────────
router.post("/customer/register", async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    if (password.length < 6)  return res.status(400).json({ error: "Password must be at least 6 characters" });

    const exists = await query("SELECT id FROM customers WHERE email = $1", [email.toLowerCase()]);
    if (exists.rows.length > 0) return res.status(409).json({ error: "Email already registered" });

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO customers (email, password_hash, name, phone) VALUES ($1,$2,$3,$4) RETURNING id, email, name",
      [email.toLowerCase(), hash, name || null, phone || null]
    );

    const customer = result.rows[0];
    const token    = signCustomerToken(customer);
    res.status(201).json({ token, customer: { id:customer.id, email:customer.email, name:customer.name } });
  } catch (err) {
    console.error("Register error", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// ─── CUSTOMER LOGIN ───────────────────────────────────────────────────────────
router.post("/customer/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const result = await query(
      "SELECT id, email, name, phone, password_hash FROM customers WHERE email = $1",
      [email.toLowerCase()]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid email or password" });

    const customer = result.rows[0];
    const match    = await bcrypt.compare(password, customer.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = signCustomerToken(customer);
    res.json({
      token,
      customer: { id:customer.id, email:customer.email, name:customer.name, phone:customer.phone },
    });
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ─── CUSTOMER PROFILE ─────────────────────────────────────────────────────────
router.get("/customer/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "Not authenticated" });
    // Middleware handles token validation on protected routes
    // This endpoint is called after requireCustomer middleware from server.js
    const result = await query(
      "SELECT id, email, name, phone, dietary_prefs, created_at FROM customers WHERE id = $1",
      [req.customerId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Customer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// ─── STAFF PIN LOGIN ──────────────────────────────────────────────────────────
router.post("/staff/login", async (req, res) => {
  try {
    const { staffId, pin } = req.body;
    if (!staffId || !pin) return res.status(400).json({ error: "Staff ID and PIN required" });

    const result = await query(
      "SELECT id, stall_id, name, role, pin_hash, avatar FROM hawker_staff WHERE id = $1 AND is_active = TRUE",
      [staffId]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "Staff not found" });

    const staff = result.rows[0];
    const match = await bcrypt.compare(pin, staff.pin_hash);
    if (!match) return res.status(401).json({ error: "Wrong PIN" });

    const token = signStaffToken(staff);
    res.json({
      token,
      staff: { id:staff.id, stallId:staff.stall_id, name:staff.name, role:staff.role, avatar:staff.avatar },
    });
  } catch (err) {
    console.error("Staff login error", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/staff/verify-pin", async (req, res) => {
  try {
    const { staffId, pin } = req.body;
    if (!staffId || !pin) return res.status(400).json({ error: "staffId and pin required" });
    const result = await query("SELECT pin_hash FROM hawker_staff WHERE id=$1", [staffId]);
    if (!result.rows.length) return res.status(404).json({ error: "Not found" });
    const ok = await bcrypt.compare(pin, result.rows[0].pin_hash);
    if (!ok) return res.status(401).json({ error: "Wrong PIN" });
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Verify failed" }); }
});

// ─── LIST STAFF FOR A STALL (for PIN screen — no auth needed, returns names only) ──
router.get("/staff/list/:stallId", async (req, res) => {
  try {
    const result = await query(
      "SELECT id, name, role, avatar FROM hawker_staff WHERE stall_id = $1 AND is_active = TRUE ORDER BY role",
      [req.params.stallId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load staff" });
  }
});

// ─── REFRESH TOKEN ────────────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  // In production, use refresh tokens stored in DB. For now re-verify current token.
  res.json({ message: "Use existing token — 30d expiry for customers, 12h for staff" });
});

export default router;