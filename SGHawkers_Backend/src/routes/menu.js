import { Router } from "express";
import { query } from "../db/pool.js";
import { requireStaff, requireOwner, optionalCustomer } from "../middleware/auth.js";
import { emitMenuUpdate } from "../websocket/wsManager.js";

const router = Router();

// ─── GET MENU FOR A STALL (customer & hawker) ─────────────────────────────────
router.get("/:stallId", optionalCustomer, async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM menu_items WHERE stall_id = $1 ORDER BY sort_order, name",
      [req.params.stallId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load menu" });
  }
});

// ─── GET POPULAR DISHES ACROSS ALL STALLS ────────────────────────────────────
router.get("/popular/all", async (req, res) => {
  try {
    const result = await query(`
      SELECT mi.*, s.name AS stall_name, s.slug AS stall_slug,
             c.name AS centre_name, c.slug AS centre_slug
      FROM menu_items mi
      JOIN stalls s ON s.id = mi.stall_id
      JOIN centres c ON c.id = s.centre_id
      WHERE mi.is_hot = TRUE AND mi.is_sold_out = FALSE
      ORDER BY mi.is_popular DESC, mi.updated_at DESC
      LIMIT 12
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load popular dishes" });
  }
});

// ─── ADD MENU ITEM (owner only) ───────────────────────────────────────────────
router.post("/:stallId", requireOwner, async (req, res) => {
  try {
    const { name, description, price, cost, category, calories, eco, is_popular, is_hot, dietary_tags, daily_max, sort_order, image_urls, supplier_id } = req.body;
    if (!name || !price) return res.status(400).json({ error: "Name and price required" });

    const result = await query(`
      INSERT INTO menu_items (stall_id,name,description,price,cost,category,calories,eco,is_popular,is_hot,dietary_tags,daily_max,portions_left,sort_order,image_urls,supplier_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `, [req.params.stallId, name, description||null, price, cost||0, category||'Main', calories||0, eco||false, is_popular||false, is_hot||false, dietary_tags||[], daily_max||50, daily_max||50, sort_order||0, image_urls||[], supplier_id||null]);
    const item = result.rows[0];
    emitMenuUpdate(req.stallId, item);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create menu item" });
  }
});

// ─── UPDATE MENU ITEM (staff: toggle soldout/stock; owner: full edit) ─────────
router.patch("/:itemId", requireStaff, async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;

    // Staff (any role) can toggle soldOut, stock_level, portions_left
    // Only owner can change price, name, description, cost
    const ownerFields = ["name","description","price","cost","category","calories","dietary_tags","daily_max","sort_order","is_popular","is_hot","eco", "image_urls", "supplier_id"];
    const staffFields  = ["is_sold_out","stock_level","portions_left"];

    const allowed = req.staffRole === "owner"
      ? [...ownerFields, ...staffFields]
      : staffFields;

    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

if (filtered.image_urls !== undefined && Array.isArray(filtered.image_urls)) {
  // already an array, postgres driver handles it
  filtered.image_urls = filtered.image_urls;
}

    if (Object.keys(filtered).length === 0) return res.status(400).json({ error: "No valid fields to update" });

    // Auto-derive stock_level from portions_left if provided
    if (filtered.portions_left !== undefined) {
      const itemRes = await query("SELECT daily_max FROM menu_items WHERE id = $1", [itemId]);
      if (itemRes.rows.length > 0) {
        const pct = filtered.portions_left / itemRes.rows[0].daily_max;
        filtered.stock_level  = filtered.portions_left === 0 ? "soldout" : pct <= 0.25 ? "low" : "ok";
        filtered.is_sold_out  = filtered.portions_left === 0;
      }
    }

    const cols   = Object.keys(filtered).map((k,i) => `${k} = $${i+2}`).join(", ");
    const values = Object.values(filtered);

    const result = await query(
      `UPDATE menu_items SET ${cols}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [itemId, ...values]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "Item not found" });

    const item = result.rows[0];
    emitMenuUpdate(req.stallId, item);
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update menu item" });
  }
});

// ─── DELETE MENU ITEM (owner only) ───────────────────────────────────────────
router.delete("/:itemId", requireOwner, async (req, res) => {
  try {
    const result = await query("DELETE FROM menu_items WHERE id = $1 RETURNING stall_id", [req.params.itemId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Item not found" });
    emitMenuUpdate(req.stallId, { id: req.params.itemId, deleted: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete menu item" });
  }
});

export default router;
