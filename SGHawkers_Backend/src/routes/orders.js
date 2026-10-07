import { Router } from "express";
import { query, getClient } from "../db/pool.js";
import { requireCustomer, requireStaff } from "../middleware/auth.js";
import { emitNewOrder, emitOrderStatusUpdate, emitCustomerNotification } from "../websocket/wsManager.js";

const router = Router();

function genOrderRef() {
  const now  = new Date();
  const mmdd = String(now.getMonth()+1).padStart(2,"0") + String(now.getDate()).padStart(2,"0");
  const rand = Math.floor(Math.random()*9000+1000);
  return `ORD-${mmdd}-${rand}`;
}

// ─── CUSTOMER: PLACE ORDER ────────────────────────────────────────────────────
router.post("/", requireCustomer, async (req, res) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const {
      stallId, centreId, items, orderType, subtotal, deliveryFee,
      ecoDiscount, total, ecoContainer, scheduledDate, scheduledTime,
      note, groupOrder, groupMembers, prepMins
    } = req.body;

    if (!stallId || !items?.length) return res.status(400).json({ error: "stallId and items required" });

    // Check all items are available
    for (const item of items) {
      const check = await client.query(
        "SELECT is_sold_out, portions_left FROM menu_items WHERE id = $1",
        [item.menuItemId]
      );
      if (check.rows.length === 0) throw new Error(`Item ${item.menuItemId} not found`);
      if (check.rows[0].is_sold_out) throw new Error(`${item.name} is sold out`);
      if (check.rows[0].portions_left < item.qty) throw new Error(`Not enough portions of ${item.name}`);
    }

    // Insert order
    const orderRes = await client.query(`
      INSERT INTO orders (order_ref, customer_id, stall_id, centre_id, customer_name,
        order_type, subtotal, delivery_fee, eco_discount, total, eco_container,
        scheduled_date, scheduled_time, note, group_order, group_members, prep_mins, status)
      VALUES ($1,$2,$3,$4,(SELECT name FROM customers WHERE id=$2),
        $5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'new')
      RETURNING *
    `, [genOrderRef(), req.customerId, stallId, centreId||null,
        orderType, subtotal, deliveryFee||0, ecoDiscount||0, total,
        ecoContainer||false, scheduledDate||null, scheduledTime||null,
        note||null, groupOrder||false, groupMembers||[], prepMins||15]);

    const order = orderRes.rows[0];

    // Insert order items + deduct portions
    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, menu_item_id, name, qty, unit_price, subtotal)
        VALUES ($1,$2,$3,$4,$5,$6)
      `, [order.id, item.menuItemId, item.name, item.qty, item.unitPrice, item.unitPrice * item.qty]);

      // Deduct portions
      await client.query(`
        UPDATE menu_items
        SET portions_left = GREATEST(portions_left - $1, 0),
            stock_level   = CASE
              WHEN portions_left - $1 <= 0 THEN 'soldout'::stock_level
              WHEN (portions_left - $1)::float / daily_max <= 0.25 THEN 'low'::stock_level
              ELSE 'ok'::stock_level END,
            is_sold_out   = (portions_left - $1 <= 0),
            updated_at    = NOW()
        WHERE id = $2
      `, [item.qty, item.menuItemId]);
    }

    // Add loyalty stamp
    await client.query(`
      INSERT INTO loyalty_stamps (customer_id, stall_id, stamps, total_earned)
      VALUES ($1,$2,1,1)
      ON CONFLICT (customer_id, stall_id)
      DO UPDATE SET stamps = loyalty_stamps.stamps + 1,
                    total_earned = loyalty_stamps.total_earned + 1,
                    updated_at = NOW()
    `, [req.customerId, stallId]);

    await client.query("COMMIT");

    // Load full order with items for WebSocket
    const full = await getFullOrder(order.id);

    // Notify hawker dashboard via WebSocket
    emitNewOrder(stallId, full);

    // Notify customer
    await query(`
      INSERT INTO notifications (customer_id, type, icon, title, body)
      VALUES ($1,'order_placed','🎉','Order placed!','Your order is being prepared.')
    `, [req.customerId]);

    res.status(201).json(full);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Place order error", err);
    res.status(err.message.includes("sold out") || err.message.includes("Not enough") ? 409 : 500)
       .json({ error: err.message || "Failed to place order" });
  } finally {
    client.release();
  }
});

// ─── CUSTOMER: GET OWN ORDERS ─────────────────────────────────────────────────
router.get("/my", requireCustomer, async (req, res) => {
  try {
    const result = await query(`
      SELECT o.*,
        s.name AS stall_name, s.slug AS stall_slug,
        c.name AS centre_name, c.slug AS centre_slug,
        json_agg(json_build_object('name',oi.name,'qty',oi.qty,'unit_price',oi.unit_price)) AS items
      FROM orders o
      JOIN stalls s ON s.id = o.stall_id
      JOIN centres c ON c.id = o.centre_id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.customer_id = $1
      GROUP BY o.id, s.name, s.slug, c.name, c.slug
      ORDER BY o.created_at DESC
      LIMIT 30
    `, [req.customerId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// ─── HAWKER: GET STALL ORDERS ─────────────────────────────────────────────────
router.get("/stall/:stallId", requireStaff, async (req, res) => {
  try {
    const { status, date } = req.query;
    let sql = `
      SELECT o.*,
        json_agg(json_build_object('menuItemId',oi.menu_item_id,'name',oi.name,'qty',oi.qty,'unit_price',oi.unit_price)) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.stall_id = $1
    `;
    const params = [req.params.stallId];
    if (status) { sql += ` AND o.status = $${params.length+1}`; params.push(status); }
    if (date)   { sql += ` AND DATE(o.created_at) = $${params.length+1}`; params.push(date); }
    sql += " GROUP BY o.id ORDER BY o.created_at DESC";

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to load orders" });
  }
});

// ─── HAWKER: UPDATE ORDER STATUS ──────────────────────────────────────────────
router.patch("/:orderId/status", requireStaff, async (req, res) => {
  try {
    const { status, cancelReason } = req.body;
    const validStatuses = ["preparing","ready","collected","delivered","cancelled"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    const extra = {};
    if (status === "preparing")  extra.started_at   = new Date().toISOString();
    if (status === "ready")      extra.ready_at      = new Date().toISOString();
    if (status === "collected")  extra.collected_at  = new Date().toISOString();
    if (status === "cancelled")  { extra.cancelled_at = new Date().toISOString(); if (cancelReason) extra.cancel_reason = cancelReason; }

    const cols   = Object.keys(extra).map((k,i) => `${k} = $${i+3}`).join(", ");
    const values = Object.values(extra);
    const sql    = `UPDATE orders SET status = $2 ${cols ? ", "+cols : ""}, updated_at = NOW() WHERE id = $1 RETURNING *`;

    const result = await query(sql, [req.params.orderId, status, ...values]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Order not found" });

    const order = result.rows[0];
    const full  = await getFullOrder(order.id);

    // Notify both hawker dashboard and customer
    emitOrderStatusUpdate(req.stallId, order.customer_id, full);

    // Push customer notification
    if (order.customer_id) {
      const notifMsg = {
        preparing: { icon:"🍳", title:"Now preparing your order", body:`Your order ${order.order_ref} is being prepared.` },
        ready:     { icon:"✅", title:"Order ready for pick-up!", body:`${order.order_ref} — head to the stall when ready.` },
        collected: { icon:"🎉", title:"Enjoy your meal!", body:`Thank you for ordering from SGHawkers.` },
        cancelled: { icon:"❌", title:"Order cancelled", body:cancelReason || `Your order ${order.order_ref} was cancelled.` },
      }[status];

      if (notifMsg) {
        await query(`
          INSERT INTO notifications (customer_id, type, icon, title, body)
          VALUES ($1,$2,$3,$4,$5)
        `, [order.customer_id, status, notifMsg.icon, notifMsg.title, notifMsg.body]);
        emitCustomerNotification(order.customer_id, notifMsg);
      }
    }

    res.json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// ─── HAWKER: REPORT ISSUE ────────────────────────────────────────────────────
router.post("/:orderId/issue", requireStaff, async (req, res) => {
  try {
    const { issueType, message } = req.body;
    const orderRes = await query("SELECT * FROM orders WHERE id = $1", [req.params.orderId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: "Order not found" });
    const order = orderRes.rows[0];

    if (issueType === "soldout") {
      await query("UPDATE orders SET status='cancelled', cancelled_at=NOW(), cancel_reason=$2 WHERE id=$1", [req.params.orderId, message || "Item sold out"]);
    }

    if (order.customer_id) {
      const icon  = issueType === "soldout" ? "❌" : "⏱";
      const title = issueType === "soldout" ? "Item unavailable" : "Order running late";
      const body  = message || (issueType === "soldout" ? "An item in your order was unavailable. A refund will be processed." : "Your order is taking a bit longer than expected.");

      await query(`INSERT INTO notifications (customer_id,type,icon,title,body) VALUES ($1,$2,$3,$4,$5)`,
        [order.customer_id, issueType, icon, title, body]);
      emitCustomerNotification(order.customer_id, { type:issueType, icon, title, body });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to report issue" });
  }
});

// ─── HELPER ───────────────────────────────────────────────────────────────────
async function getFullOrder(orderId) {
  const res = await query(`
    SELECT o.*,
      s.name AS stall_name, s.slug AS stall_slug,
      json_agg(json_build_object('menuItemId',oi.menu_item_id,'name',oi.name,'qty',oi.qty,'unitPrice',oi.unit_price,'subtotal',oi.subtotal)) AS items
    FROM orders o
    LEFT JOIN stalls s ON s.id = o.stall_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = $1
    GROUP BY o.id, s.name, s.slug
  `, [orderId]);
  return res.rows[0];
}

export default router;
