import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sghawkers-dev-secret-change-in-production";

// ─── CUSTOMER AUTH ────────────────────────────────────────────────────────────
export function requireCustomer(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== "customer") return res.status(403).json({ error: "Customer token required" });
    req.customerId = payload.id;
    req.customerEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── HAWKER STAFF AUTH ────────────────────────────────────────────────────────
export function requireStaff(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type !== "staff") return res.status(403).json({ error: "Staff token required" });
    req.staffId  = payload.id;
    req.stallId  = payload.stallId;
    req.staffRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// ─── OWNER ONLY ───────────────────────────────────────────────────────────────
export function requireOwner(req, res, next) {
  requireStaff(req, res, () => {
    if (req.staffRole !== "owner") return res.status(403).json({ error: "Owner access required" });
    next();
  });
}

// ─── OPTIONAL AUTH (customer side — some routes work without login) ───────────
export function optionalCustomer(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.type === "customer") {
      req.customerId = payload.id;
      req.customerEmail = payload.email;
    }
  } catch { /* ignore */ }
  next();
}

// ─── TOKEN HELPERS ────────────────────────────────────────────────────────────
function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
  return req.cookies?.token || null;
}

export function signCustomerToken(customer) {
  return jwt.sign(
    { type:"customer", id:customer.id, email:customer.email },
    JWT_SECRET,
    { expiresIn:"30d" }
  );
}

export function signStaffToken(staff) {
  return jwt.sign(
    { type:"staff", id:staff.id, stallId:staff.stall_id, role:staff.role, name:staff.name },
    JWT_SECRET,
    { expiresIn:"12h" }
  );
}