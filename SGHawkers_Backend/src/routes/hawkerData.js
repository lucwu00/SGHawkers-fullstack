// ─── inventory.js ────────────────────────────────────────────────────────────
import { Router as IRouter } from "express";
import { query as iQuery } from "../db/pool.js";
import { requireStaff, requireOwner } from "../middleware/auth.js";
import { emitInventoryAlert } from "../websocket/wsManager.js";

export const inventoryRouter = IRouter();

inventoryRouter.get("/:stallId", requireStaff, async (req, res) => {
  try {
    const result = await iQuery(`
      SELECT DISTINCT ON (i.id) i.*,
        s.name AS supplier_name, s.contact AS supplier_contact, s.lead_days, s.min_order
      FROM ingredients i
      LEFT JOIN supplier_ingredients si ON si.ingredient_id = i.id
      LEFT JOIN suppliers s ON s.id = si.supplier_id
      WHERE i.stall_id = $1
      ORDER BY i.id, i.category, i.name
    `, [req.params.stallId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load inventory" }); }
});

inventoryRouter.patch("/:ingredientId", requireStaff, async (req, res) => {
  try {
    const { qty, min_qty, max_qty, cost_per_unit, expiry_days, last_restocked, used_per_day, note } = req.body;
    const result = await iQuery(`
      UPDATE ingredients SET
        qty             = COALESCE($2, qty),
        min_qty         = COALESCE($3, min_qty),
        max_qty         = COALESCE($4, max_qty),
        cost_per_unit   = COALESCE($5, cost_per_unit),
        expiry_days     = COALESCE($6, expiry_days),
        last_restocked  = COALESCE($7, last_restocked),
        used_per_day    = COALESCE($8, used_per_day),
        note            = COALESCE($9, note),
        updated_at      = NOW()
      WHERE id = $1 RETURNING *
    `, [req.params.ingredientId, qty, min_qty, max_qty, cost_per_unit, expiry_days, last_restocked, used_per_day, note]);

    if (result.rows.length === 0) return res.status(404).json({ error: "Ingredient not found" });
    const ing = result.rows[0];

    // Alert if below minimum
    if (ing.qty < ing.min_qty) {
      emitInventoryAlert(req.stallId, {
        type:"low_stock", icon:"⚠️",
        message:`${ing.name} — ${ing.qty} ${ing.unit} left (minimum: ${ing.min_qty})`,
        time: new Date().toLocaleTimeString("en-SG",{hour:"2-digit",minute:"2-digit"}),
      });
    }
    res.json(ing);
  } catch (err) { res.status(500).json({ error: "Failed to update ingredient" }); }
});

inventoryRouter.get("/:stallId/suppliers", requireStaff, async (req, res) => {
  try {
    const result = await iQuery(`
      SELECT s.*,
        json_agg(json_build_object('id',i.id,'name',i.name,'unit',i.unit)) AS ingredients
      FROM suppliers s
      LEFT JOIN supplier_ingredients si ON si.supplier_id = s.id
      LEFT JOIN ingredients i ON i.id = si.ingredient_id
      WHERE s.stall_id = $1
      GROUP BY s.id
      ORDER BY s.name
    `, [req.params.stallId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load suppliers" }); }
});

// Add ingredient
inventoryRouter.post("/:stallId/ingredients", requireOwner, async (req, res) => {
  try {
    const { name, unit, category, qty, min_qty, max_qty, cost_per_unit, expiry_days, used_per_day, note } = req.body;
    if (!name || !unit) return res.status(400).json({ error: "Name and unit required" });
    const result = await iQuery(`
      INSERT INTO ingredients (stall_id,name,unit,category,qty,min_qty,max_qty,cost_per_unit,expiry_days,used_per_day,note)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [req.params.stallId, name, unit, category||"General", qty||0, min_qty||0, max_qty||100, cost_per_unit||0, expiry_days||null, used_per_day||0, note||""]);
    res.status(201).json(result.rows[0]);
  } catch(e) { res.status(500).json({ error: "Failed to add ingredient" }); }
});

// Delete ingredient
inventoryRouter.delete("/ingredients/:ingredientId", requireOwner, async (req, res) => {
  try {
    await iQuery("DELETE FROM ingredients WHERE id=$1", [req.params.ingredientId]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: "Failed to delete ingredient" }); }
});

// Add supplier
inventoryRouter.post("/:stallId/suppliers", requireOwner, async (req, res) => {
  try {
    const { name, contact, email, lead_days, min_order, notes } = req.body;
    const result = await iQuery(`
      INSERT INTO suppliers (stall_id,name,contact,email,lead_days,min_order,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [req.params.stallId, name, contact||"", email||"", lead_days||1, min_order||0, notes||""]);
    res.status(201).json(result.rows[0]);
  } catch(e) { res.status(500).json({error:"Failed to add supplier"}); }
});

// Edit supplier
inventoryRouter.patch("/suppliers/:supplierId", requireOwner, async (req, res) => {
  try {
    const { name, contact, email, lead_days, min_order, notes } = req.body;
    const result = await iQuery(`
      UPDATE suppliers SET
        name      = COALESCE($2, name),
        contact   = COALESCE($3, contact),
        email     = COALESCE($4, email),
        lead_days = COALESCE($5, lead_days),
        min_order = COALESCE($6, min_order),
        notes     = COALESCE($7, notes)
      WHERE id=$1 RETURNING *
    `, [req.params.supplierId, name, contact, email, lead_days, min_order, notes]);
    res.json(result.rows[0]);
  } catch(e) { res.status(500).json({error:"Failed to update supplier"}); }
});

// Delete supplier
inventoryRouter.delete("/suppliers/:supplierId", requireOwner, async (req, res) => {
  try {
    await iQuery("DELETE FROM suppliers WHERE id=$1", [req.params.supplierId]);
    res.json({success:true});
  } catch(e) { res.status(500).json({error:"Failed to delete supplier"}); }
});

// supplier-ingredients
inventoryRouter.post("/supplier-ingredients", requireOwner, async (req, res) => {
  try {
    const { ingredient_id, supplier_id } = req.body;
    // Remove old link first, then insert new one
    await iQuery("DELETE FROM supplier_ingredients WHERE ingredient_id=$1", [ingredient_id]);
    if (supplier_id) {
      await iQuery(
        "INSERT INTO supplier_ingredients (supplier_id, ingredient_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [supplier_id, ingredient_id]
      );
    }
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: "Failed to update supplier link" }); }
});

// Sync all linked ingredients for a supplier (bulk replace)
inventoryRouter.post("/suppliers/:supplierId/ingredients", requireOwner, async (req, res) => {
  try {
    const { ingredient_ids } = req.body;
    await iQuery("DELETE FROM supplier_ingredients WHERE supplier_id=$1", [req.params.supplierId]);
    await iQuery("UPDATE ingredients SET supplier_id=NULL WHERE supplier_id=$1", [req.params.supplierId]);
    for (const ingId of (ingredient_ids||[])) {
      await iQuery(
        "INSERT INTO supplier_ingredients (supplier_id,ingredient_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
        [req.params.supplierId, ingId]
      );
      await iQuery("UPDATE ingredients SET supplier_id=$1 WHERE id=$2", [req.params.supplierId, ingId]);
    }
    res.json({ success: true });
  } catch(e) {
    console.error(e);
    res.status(500).json({ error: "Failed to sync ingredient links" });
  }
});


// ─── notifications.js ─────────────────────────────────────────────────────────
import { Router as NRouter } from "express";
import { query as nQuery } from "../db/pool.js";
import { requireCustomer as nRequireCustomer } from "../middleware/auth.js";

export const notificationsRouter = NRouter();

notificationsRouter.get("/", nRequireCustomer, async (req, res) => {
  try {
    const result = await nQuery(`
      SELECT * FROM notifications WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50
    `, [req.customerId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load notifications" }); }
});

notificationsRouter.patch("/read-all", nRequireCustomer, async (req, res) => {
  try {
    await nQuery("UPDATE notifications SET is_read=TRUE WHERE customer_id=$1", [req.customerId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to mark read" }); }
});

notificationsRouter.patch("/:id/read", nRequireCustomer, async (req, res) => {
  try {
    await nQuery("UPDATE notifications SET is_read=TRUE WHERE id=$1 AND customer_id=$2", [req.params.id, req.customerId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to mark read" }); }
});

// ─── hawkerData.js ────────────────────────────────────────────────────────────
import { Router as HRouter } from "express";
import { query as hQuery } from "../db/pool.js";
import { requireStaff as hRequireStaff, requireOwner as hRequireOwner } from "../middleware/auth.js";

export const hawkerDataRouter = HRouter();

// Transactions
hawkerDataRouter.get("/transactions/:stallId", hRequireStaff, async (req, res) => {
  try {
    const { date } = req.query;
    let sql = `
      SELECT t.*,
        COALESCE(
          json_agg(json_build_object('name',ti.name,'qty',ti.qty,'unit_price',ti.unit_price))
          FILTER (WHERE ti.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.stall_id = $1
    `;
    const params = [req.params.stallId];
    if (date) { sql += ` AND DATE(t.created_at) = $2`; params.push(date); }
    sql += " GROUP BY t.id ORDER BY t.created_at DESC";
    const result = await hQuery(sql, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load transactions" }); }
});

hawkerDataRouter.post("/transactions/:stallId", hRequireStaff, async (req, res) => {
  try {
    const { items, subtotal, discount, total, method, cashGiven, changeDue, payNowRef } = req.body;
    const ref = `TXN-${String(new Date().getMonth()+1).padStart(2,"0")}${String(new Date().getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000+1000)}`;
    const txnRes = await hQuery(`
      INSERT INTO transactions (txn_ref,stall_id,staff_id,subtotal,discount,total,method,cash_given,change_due,paynow_ref)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [ref, req.params.stallId, req.staffId, subtotal, discount||0, total, method, cashGiven||0, changeDue||0, payNowRef||null]);
    const txn = txnRes.rows[0];
    for (const item of (items||[])) {
      await hQuery("INSERT INTO transaction_items(transaction_id,name,qty,unit_price,subtotal) VALUES($1,$2,$3,$4,$5)",
        [txn.id, item.name, item.qty, item.unitPrice, item.unitPrice*item.qty]);
    }
    // Return transaction WITH items so cashier log updates immediately
    const full = await hQuery(`
      SELECT t.*,
        COALESCE(
          json_agg(json_build_object('name',ti.name,'qty',ti.qty,'unit_price',ti.unit_price))
          FILTER (WHERE ti.id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [txn.id]);
    res.status(201).json(full.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to save transaction" }); }
});

// Expenses
hawkerDataRouter.get("/expenses/:stallId", hRequireStaff, async (req, res) => {
  try {
    const result = await hQuery("SELECT * FROM expenses WHERE stall_id=$1 ORDER BY date DESC,created_at DESC", [req.params.stallId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load expenses" }); }
});

hawkerDataRouter.post("/expenses/:stallId", hRequireOwner, async (req, res) => {
  try {
    const { date, category, description, amount, supplierId } = req.body;
    const result = await hQuery(`
      INSERT INTO expenses (stall_id,date,category,description,amount,supplier_id)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [req.params.stallId, date||new Date(new Date().getTime() + 8*3600000).toISOString().slice(0,10), category, description, amount, supplierId||null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to save expense" }); }
});

hawkerDataRouter.delete("/expenses/:expenseId", hRequireOwner, async (req, res) => {
  try {
    await hQuery("DELETE FROM expenses WHERE id=$1", [req.params.expenseId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete expense" }); }
});

// Daily Close Report 
hawkerDataRouter.get("/close-report/:stallId", hRequireOwner, async (req, res) => {
  try {
    const { date } = req.query;
    const d = date || new Date(new Date().getTime() + 8*3600000).toISOString().slice(0,10);

    const [txns, exps, waste] = await Promise.all([
      hQuery(`
        SELECT t.*,
          COALESCE(
            json_agg(json_build_object('name',ti.name,'qty',ti.qty,'unit_price',ti.unit_price))
            FILTER (WHERE ti.id IS NOT NULL), '[]'::json
          ) AS items
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
        WHERE t.stall_id = $1 AND DATE(t.created_at + INTERVAL '8 hours') = $2
        GROUP BY t.id ORDER BY t.created_at DESC
      `, [req.params.stallId, d]),

      hQuery(
        "SELECT * FROM expenses WHERE stall_id=$1 AND date=$2 ORDER BY created_at DESC",
        [req.params.stallId, d]
      ),

      hQuery(
        "SELECT * FROM waste_log WHERE stall_id=$1 AND date=$2 ORDER BY created_at DESC",
        [req.params.stallId, d]
      ),
    ]);

    const transactions = txns.rows;
    const expenses     = exps.rows;
    const wasteLog     = waste.rows;

    // Compute summary figures
    const revenue  = transactions.reduce((s,t) => s + parseFloat(t.total||0), 0);
    const expTotal = expenses.reduce((s,e) => s + parseFloat(e.amount||0), 0);
    const wasteVal = wasteLog.reduce((s,w) => s + parseFloat(w.value_lost||0), 0);

    // Payment split
    const cashRev   = transactions.filter(t=>t.method==="cash").reduce((s,t)=>s+parseFloat(t.total||0),0);
    const paynowRev = transactions.filter(t=>t.method==="paynow").reduce((s,t)=>s+parseFloat(t.total||0),0);
    const cashCount   = transactions.filter(t=>t.method==="cash").length;
    const paynowCount = transactions.filter(t=>t.method==="paynow").length;

    // Top dish
    const counts = {};
    transactions.forEach(t=>(t.items||[]).forEach(i=>{ counts[i.name]=(counts[i.name]||0)+i.qty; }));
    const sorted  = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const topDish = sorted[0] ? `${sorted[0][0]} (${sorted[0][1]} sold)` : null;

    res.json({
      date: d,
      revenue, expTotal, wasteVal,
      cashRev, paynowRev, cashCount, paynowCount,
      txnCount: transactions.length,
      topDish,
      transactions, expenses, wasteLog,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load close report" });
  }
});

// Waste Log
hawkerDataRouter.get("/waste/:stallId", hRequireStaff, async (req, res) => {
  try {
    const result = await hQuery("SELECT * FROM waste_log WHERE stall_id=$1 AND date >= NOW() - INTERVAL '3 months' ORDER BY date DESC,created_at DESC", [req.params.stallId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load waste log" }); }
});

hawkerDataRouter.post("/waste/:stallId", hRequireStaff, async (req, res) => {
  try {
    const { date, item_name, qty, unit, reason, value_lost, disposed } = req.body;
    const result = await hQuery(`
      INSERT INTO waste_log (stall_id,date,item_name,qty,unit,reason,value_lost,disposed)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [req.params.stallId, date||new Date(new Date().getTime() + 8*3600000).toISOString().slice(0,10), item_name, qty, unit, reason, value_lost, disposed||'bin']);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to log waste" }); }
});

hawkerDataRouter.patch("/waste/:id", hRequireStaff, async (req,res) => {
  try {
    const { item_name, qty, unit, reason, value_lost, disposed } = req.body;
    const result = await hQuery(`
      UPDATE waste_log SET item_name=$1,qty=$2,unit=$3,reason=$4,value_lost=$5,disposed=$6
      WHERE id=$7 RETURNING *
    `, [item_name,qty,unit,reason,value_lost,disposed,req.params.id]);
    res.json(result.rows[0]);
  } catch { res.status(500).json({error:"Failed to update"}); }
});

hawkerDataRouter.delete("/waste/:id", hRequireStaff, async (req,res) => {
  try {
    await hQuery("DELETE FROM waste_log WHERE id=$1", [req.params.id]);
    res.json({ success:true });
  } catch { res.status(500).json({error:"Failed to delete"}); }
});

// Promos
hawkerDataRouter.get("/promos/:stallId", hRequireStaff, async (req, res) => {
  try {
    const result = await hQuery("SELECT * FROM promos WHERE stall_id=$1 ORDER BY created_at DESC", [req.params.stallId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load promos" }); }
});

hawkerDataRouter.post("/promos/:stallId", hRequireOwner, async (req, res) => {
  try {
    const { name, description, type, value, min_spend, start_time, end_time, active_days } = req.body;
    const result = await hQuery(`
      INSERT INTO promos (stall_id,name,description,type,value,min_spend,start_time,end_time,active_days)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [req.params.stallId, name, description, type, value||0, min_spend||0, start_time||'00:00', end_time||'23:59', active_days||['Mon','Tue','Wed','Thu','Fri','Sat','Sun']]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to create promo" }); }
});

hawkerDataRouter.patch("/promos/:promoId", hRequireOwner, async (req, res) => {
  try {
    const { is_active, name, description, type, value, min_spend, start_time, end_time, active_days } = req.body;
    const result = await hQuery(`
      UPDATE promos SET
        is_active    = COALESCE($2, is_active),
        name         = COALESCE($3, name),
        description  = COALESCE($4, description),
        type         = COALESCE($5::promo_type, type),
        value        = COALESCE($6, value),
        min_spend    = COALESCE($7, min_spend),
        start_time   = COALESCE($8::time, start_time),
        end_time     = COALESCE($9::time, end_time),
        active_days  = COALESCE($10, active_days)
      WHERE id=$1 RETURNING *
    `, [req.params.promoId, is_active, name, description, type, value, min_spend, start_time, end_time, active_days]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to update promo" }); }
});

// Settings
hawkerDataRouter.get("/settings/:stallId", hRequireStaff, async (req, res) => {
  try {
    const stall = await hQuery("SELECT * FROM stalls WHERE id=$1", [req.params.stallId]);
    const settings = await hQuery("SELECT * FROM stall_settings WHERE stall_id=$1", [req.params.stallId]);
    res.json({ stall: stall.rows[0], settings: settings.rows[0] });
  } catch (err) { res.status(500).json({ error: "Failed to load settings" }); }
});

hawkerDataRouter.patch("/settings/:stallId", hRequireOwner, async (req, res) => {
  try {
    const fields = req.body;
    const cols   = Object.keys(fields).map((k,i) => `${k} = $${i+2}`).join(", ");
    const vals   = Object.values(fields);
    await hQuery(`UPDATE stall_settings SET ${cols}, updated_at=NOW() WHERE stall_id=$1`, [req.params.stallId, ...vals]);
    res.json({ success: true });
  } catch (err) {
  console.error("Settings save error:", err.message); 
  res.status(500).json({ error: "Failed to save settings" });
}
});

// Loyalty stamps for a customer at a stall
hawkerDataRouter.get("/loyalty/:stallId/:customerId", hRequireStaff, async (req, res) => {
  try {
    const result = await hQuery("SELECT * FROM loyalty_stamps WHERE stall_id=$1 AND customer_id=$2", [req.params.stallId, req.params.customerId]);
    res.json(result.rows[0] || { stamps:0, total_earned:0 });
  } catch (err) { res.status(500).json({ error: "Failed to load loyalty" }); }
});

// Favourites
hawkerDataRouter.get("/favourites", async (req, res) => {
  // handled by customerRouter but referenced here for completeness
  res.status(501).json({ error: "Use /api/customer/favourites" });
});

// Analytics summary
hawkerDataRouter.get("/analytics/:stallId", hRequireOwner, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFrom = from || new Date(Date.now() - 30*24*3600000).toISOString().slice(0,10);
    const dateTo   = to   || new Date().toISOString().slice(0,10);

    const [revenue, topDishes, expenses] = await Promise.all([
      hQuery(`
        SELECT DATE(created_at) AS date, COUNT(*) AS orders, SUM(total) AS revenue
        FROM orders WHERE stall_id=$1 AND DATE(created_at) BETWEEN $2 AND $3
        AND status NOT IN ('cancelled') GROUP BY DATE(created_at) ORDER BY date
      `, [req.params.stallId, dateFrom, dateTo]),

      hQuery(`
        SELECT oi.name, SUM(oi.qty) AS sold, SUM(oi.subtotal) AS revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.stall_id=$1 AND DATE(o.created_at) BETWEEN $2 AND $3 AND o.status != 'cancelled'
        GROUP BY oi.name ORDER BY sold DESC LIMIT 10
      `, [req.params.stallId, dateFrom, dateTo]),

      hQuery(`
        SELECT category, SUM(amount) AS total FROM expenses
        WHERE stall_id=$1 AND date BETWEEN $2 AND $3 GROUP BY category
      `, [req.params.stallId, dateFrom, dateTo]),
    ]);

    res.json({ revenue: revenue.rows, topDishes: topDishes.rows, expenses: expenses.rows });
  } catch (err) { res.status(500).json({ error: "Failed to load analytics" }); }
});

// Staff management
hawkerDataRouter.get("/staff/:stallId", hRequireOwner, async (req, res) => {
  try {
    const result = await hQuery("SELECT id,stall_id,name,role,avatar,phone, address,is_active,created_at FROM hawker_staff WHERE stall_id=$1 ORDER BY role", [req.params.stallId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load staff" }); }
});

hawkerDataRouter.post("/staff/:stallId", hRequireOwner, async (req, res) => {
  try {
    const bcrypt = await import("bcrypt");
    const { name, role, pin, avatar } = req.body;
    if (!name || !pin || pin.length !== 4) return res.status(400).json({ error: "Name and 4-digit PIN required" });
    const pinHash = await bcrypt.default.hash(pin, 12);
    const result  = await hQuery(`
      INSERT INTO hawker_staff (stall_id,name,role,pin_hash,avatar)
      VALUES ($1,$2,$3,$4,$5) RETURNING id,stall_id,name,role,avatar,created_at
    `, [req.params.stallId, name, role||'cashier', pinHash, avatar||'👤']);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to add staff" }); }
});

hawkerDataRouter.delete("/staff/:staffId", hRequireOwner, async (req, res) => {
  try {
    await hQuery("UPDATE hawker_staff SET is_active=FALSE WHERE id=$1", [req.params.staffId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to remove staff" }); }
});

hawkerDataRouter.delete("/promos/:promoId", hRequireStaff, async (req,res) => {
  try {
    await hQuery("DELETE FROM promos WHERE id=$1", [req.params.promoId]);
    res.json({ success:true });
  } catch { res.status(500).json({error:"Failed to delete promo"}); }
});

// Shift log
hawkerDataRouter.get("/shifts/:stallId", hRequireOwner, async (req, res) => {
  try {
    const result = await hQuery(`
      SELECT sl.*, hs.name, hs.role, hs.avatar
      FROM shift_log sl JOIN hawker_staff hs ON hs.id=sl.staff_id
      WHERE sl.stall_id=$1 ORDER BY sl.date DESC, sl.clock_in DESC LIMIT 50
    `, [req.params.stallId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load shifts" }); }
});

hawkerDataRouter.patch("/staff/:staffId", hRequireOwner, async (req, res) => {
  try {
    const { name, role, avatar, phone, address } = req.body;
    const result = await hQuery(`
      UPDATE hawker_staff SET
        name    = COALESCE($2, name),
        role    = COALESCE($3, role),
        avatar  = COALESCE($4, avatar),
        phone   = COALESCE($5, phone),
        address = COALESCE($6, address)
      WHERE id = $1 RETURNING id,name,role,avatar,phone,address,is_active,created_at
    `, [req.params.staffId, name, role, avatar, phone, address]);
    res.json(result.rows[0]);
  } catch(e) { res.status(500).json({ error: "Failed to update staff" }); }
});

hawkerDataRouter.post("/shifts/clock-in", hRequireStaff, async (req, res) => {
  try {
    const staffId   = req.body.staff_id || req.staffId;
    const signature = req.body.signature || null;

    const existing = await hQuery(
      "SELECT id FROM shift_log WHERE staff_id=$1 AND date=CURRENT_DATE AND clock_out IS NULL",
      [staffId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Already clocked in today" });
    }

    const result = await hQuery(
      "INSERT INTO shift_log (staff_id, stall_id, date, signature) VALUES ($1,$2,CURRENT_DATE,$3) RETURNING *",
      [staffId, req.stallId, signature]
    );
    res.json(result.rows[0]);
  } catch(e) {
    console.error("Clock-in error:", e);
    res.status(500).json({ error: "Failed to clock in" });
  }
});

hawkerDataRouter.patch("/shifts/:shiftId/clock-out", hRequireStaff, async (req, res) => {
  try {
    const result = await hQuery(`
      UPDATE shift_log SET
        clock_out    = NOW(),
        hours_worked = ROUND(EXTRACT(EPOCH FROM (NOW()-clock_in))/3600, 2)
      WHERE id=$1 RETURNING *
    `, [req.params.shiftId]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: "Failed to clock out" }); }
});

hawkerDataRouter.delete("/shifts/:shiftId", hRequireOwner, async (req, res) => {
  try {
    await hQuery("DELETE FROM shift_log WHERE id=$1", [req.params.shiftId]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete shift" }); }
});

// Notes
hawkerDataRouter.get("/notes/:stallId", hRequireStaff, async (req, res) => {
  try {
    const result = await hQuery(
      "SELECT * FROM staff_notes WHERE stall_id=$1 AND date >= NOW() - INTERVAL '3 months' ORDER BY date DESC",
      [req.params.stallId]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: "Failed to load notes" }); }
});

hawkerDataRouter.post("/notes/:stallId", hRequireStaff, async (req, res) => {
  try {
    const { date, text } = req.body;
    const result = await hQuery(`
      INSERT INTO staff_notes (stall_id, date, text)
      VALUES ($1, $2, $3)
      ON CONFLICT (stall_id, date) DO UPDATE SET text = EXCLUDED.text
      RETURNING *
    `, [req.params.stallId, date, text]);
    res.json(result.rows[0]);
  } catch { res.status(500).json({ error: "Failed to save note" }); }
});

// Tasks
hawkerDataRouter.get("/tasks/:stallId", hRequireStaff, async (req, res) => {
  try {
    const result = await hQuery(
      "SELECT * FROM staff_tasks WHERE stall_id=$1 AND date >= NOW() - INTERVAL '3 months' ORDER BY date, start_time",
      [req.params.stallId]
    );
    res.json(result.rows);
  } catch { res.status(500).json({ error: "Failed to load tasks" }); }
});

hawkerDataRouter.post("/tasks/:stallId", hRequireStaff, async (req, res) => {
  try {
    const { date, title, start_time, end_time, assigned_to, color } = req.body;
    const result = await hQuery(`
      INSERT INTO staff_tasks (stall_id, date, title, start_time, end_time, assigned_to, color)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
    `, [req.params.stallId, date, title, start_time, end_time, assigned_to||"all", color||"var(--gold)"]);
    res.status(201).json(result.rows[0]);
  } catch { res.status(500).json({ error: "Failed to save task" }); }
});

hawkerDataRouter.delete("/tasks/:taskId", hRequireStaff, async (req, res) => {
  try {
    await hQuery("DELETE FROM staff_tasks WHERE id=$1", [req.params.taskId]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete task" }); }
});

// Customer favourites (needed by customer side)
import { Router as FRouter } from "express";
import { query as fQuery } from "../db/pool.js";
import { requireCustomer as fRequireCustomer } from "../middleware/auth.js";

export const favouritesRouter = FRouter();

favouritesRouter.get("/stalls", fRequireCustomer, async (req, res) => {
  try {
    const result = await fQuery(`
      SELECT s.*, c.id AS centre_id, c.slug AS centre_slug, c.name AS centre_name
      FROM customer_fav_stalls cfs
      JOIN stalls s ON s.id = cfs.stall_id
      JOIN centres c ON c.id = s.centre_id
      WHERE cfs.customer_id = $1
    `, [req.customerId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load favourites" }); }
});

favouritesRouter.post("/stalls/:stallId", fRequireCustomer, async (req, res) => {
  try {
    await fQuery("INSERT INTO customer_fav_stalls(customer_id,stall_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [req.customerId, req.params.stallId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to add favourite" }); }
});

favouritesRouter.delete("/stalls/:stallId", fRequireCustomer, async (req, res) => {
  try {
    await fQuery("DELETE FROM customer_fav_stalls WHERE customer_id=$1 AND stall_id=$2", [req.customerId, req.params.stallId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to remove favourite" }); }
});

favouritesRouter.get("/items", fRequireCustomer, async (req, res) => {
  try {
    const result = await fQuery(`
      SELECT mi.*, s.name AS stall_name FROM customer_fav_items cfi JOIN menu_items mi ON mi.id=cfi.item_id JOIN stalls s ON s.id=mi.stall_id WHERE cfi.customer_id=$1
    `, [req.customerId]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: "Failed to load favourite items" }); }
});

favouritesRouter.post("/items/:itemId", fRequireCustomer, async (req, res) => {
  try {
    await fQuery("INSERT INTO customer_fav_items(customer_id,item_id) VALUES($1,$2) ON CONFLICT DO NOTHING", [req.customerId, req.params.itemId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to add favourite item" }); }
});

favouritesRouter.delete("/items/:itemId", fRequireCustomer, async (req, res) => {
  try {
    await fQuery("DELETE FROM customer_fav_items WHERE customer_id=$1 AND item_id=$2", [req.customerId, req.params.itemId]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to remove favourite item" }); }
});

// Portion forecasting — sales by dish per day-of-week (last 8 weeks)
hawkerDataRouter.get("/portion-forecast/:stallId", hRequireOwner, async (req, res) => {
  try {
    const [txnItems, orderItems] = await Promise.all([
      // From cashier transactions
      hQuery(`
        SELECT ti.name,
               EXTRACT(DOW FROM t.created_at AT TIME ZONE 'Asia/Singapore') AS dow,
               SUM(ti.qty) AS qty
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        WHERE t.stall_id = $1
          AND t.created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY ti.name, dow
      `, [req.params.stallId]),

      // From app orders
      hQuery(`
        SELECT oi.name,
               EXTRACT(DOW FROM o.created_at AT TIME ZONE 'Asia/Singapore') AS dow,
               SUM(oi.qty) AS qty
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.stall_id = $1
          AND o.status != 'cancelled'
          AND o.created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY oi.name, dow
      `, [req.params.stallId]),
    ]);

    // Merge both sources
    const combined = {};
    [...txnItems.rows, ...orderItems.rows].forEach(row => {
      const key = `${row.name}__${row.dow}`;
      if (!combined[key]) combined[key] = { name:row.name, dow:parseInt(row.dow), qty:0 };
      combined[key].qty += parseFloat(row.qty);
    });

    // Average over ~8 occurrences per DOW, round up with 10% buffer
    const result = {};
    Object.values(combined).forEach(({ name, dow, qty }) => {
      if (!result[name]) result[name] = {};
      result[name][dow] = Math.ceil((qty / 8) * 1.1);
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load forecast" });
  }
});