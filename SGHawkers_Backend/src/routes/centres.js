import { Router } from "express";
import { query } from "../db/pool.js";
import { requireOwner } from "../middleware/auth.js";

const router = Router();

// ─── GET ALL CENTRES ──────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*,
        COUNT(DISTINCT s.id) AS stall_count,
        ROUND(AVG(s.rating)::numeric, 2) AS avg_rating
      FROM centres c
      LEFT JOIN stalls s ON s.centre_id = c.id
      GROUP BY c.id
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load centres" });
  }
});

// ─── GET STALLS FOR A CENTRE ──────────────────────────────────────────────────
router.get("/:centreSlug/stalls", async (req, res) => {
  try {
    const result = await query(`
      SELECT s.*,
        c.name AS centre_name, c.slug AS centre_slug,
        COUNT(DISTINCT r.id) AS review_count_live
      FROM stalls s
      JOIN centres c ON c.id = s.centre_id
      LEFT JOIN reviews r ON r.stall_id = s.id
      WHERE c.slug = $1
      GROUP BY s.id, c.name, c.slug
      ORDER BY s.name
    `, [req.params.centreSlug]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load stalls" });
  }
});

// ─── GET SINGLE STALL WITH MENU ───────────────────────────────────────────────
router.get("/stall/:stallSlug", async (req, res) => {
  try {
    const stallRes = await query(`
      SELECT s.*, c.name AS centre_name, c.slug AS centre_slug,
             ss.loyalty_stamps_total, ss.loyalty_reward, ss.loyalty_bonus_at, ss.loyalty_bonus_item,
             ss.open_time, ss.close_time, ss.paynow_uen
      FROM stalls s
      JOIN centres c ON c.id = s.centre_id
      LEFT JOIN stall_settings ss ON ss.stall_id = s.id
      WHERE s.slug = $1
    `, [req.params.stallSlug]);

    if (stallRes.rows.length === 0) return res.status(404).json({ error: "Stall not found" });

    const stall = stallRes.rows[0];

    const menuRes = await query(`
      SELECT * FROM menu_items WHERE stall_id = $1 ORDER BY sort_order, name
    `, [stall.id]);

    const reviewRes = await query(`
      SELECT r.*, c.name AS customer_name
      FROM reviews r
      LEFT JOIN customers c ON c.id = r.customer_id
      WHERE r.stall_id = $1
      ORDER BY r.created_at DESC
      LIMIT 20
    `, [stall.id]);

    res.json({ stall, menu: menuRes.rows, reviews: reviewRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stall" });
  }
});

// ─── UPDATE CENTRE WAIT TIME (owner only) ─────────────────────────────────────
router.patch("/:centreId/wait-time", requireOwner, async (req, res) => {
  try {
    const { waitTime } = req.body;
    if (!["busy","moderate","quiet"].includes(waitTime)) return res.status(400).json({ error: "Invalid wait time" });
    await query("UPDATE centres SET wait_time = $1 WHERE id = $2", [waitTime, req.params.centreId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update wait time" });
  }
});

// ─── TOGGLE STALL OPEN/CLOSED (owner only, requires PIN re-verify) ────────────
router.patch("/stall/:stallId/open", requireOwner, async (req, res) => {
  try {
    const { isOpen } = req.body;
    await query("UPDATE stalls SET is_open = $1 WHERE id = $2", [isOpen, req.params.stallId]);
    // Emit WebSocket event so customer side updates instantly
    const { emitMenuUpdate } = await import("../websocket/wsManager.js");
    emitMenuUpdate(req.params.stallId, { stallId: req.params.stallId, isOpen, type:"stall_status" });
    res.json({ success: true, isOpen });
  } catch (err) {
    res.status(500).json({ error: "Failed to update stall status" });
  }
});

// ─── UPDATE STALL PROFILE (owner only) — name, story, bio, hours ─────────────
router.patch("/stall/:stallId/profile", requireOwner, async (req, res) => {
  try {
    const { name, story, hawker_bio, awards } = req.body;
    const updates = {};
    if (name       !== undefined) updates.name        = name;
    if (story      !== undefined) updates.story       = story;
    if (hawker_bio !== undefined) updates.hawker_bio  = hawker_bio;
    if (awards     !== undefined) updates.awards      = awards;

    if (Object.keys(updates).length > 0) {
      const cols   = Object.keys(updates).map((k,i) => `${k} = $${i+2}`).join(", ");
      const values = Object.values(updates);
      await query(`UPDATE stalls SET ${cols} WHERE id = $1`, [req.params.stallId, ...values]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update stall profile" });
  }
});

export default router;