import { useState, useEffect } from "react";
import { getDeliveryFee, parseKm, todayISO, addDays, fmtShort } from "../utils/helpers";
import { PICKUP_TIMES_TODAY, PICKUP_TIMES_ADV } from "../utils/constants";

// ─── CART PANEL ───────────────────────────────────────────────────────────────
export default function CartPanel({ cart, onClose, onOrder, centreDistance }) {
  const [mode, setMode]               = useState("pickup");
  const [preorder, setPreorder]       = useState(false);
  const [selDate, setSelDate]         = useState(todayISO());
  const [pickupTime, setPickupTime]   = useState("12:00 PM");
  const [ecoContainer, setEcoContainer] = useState(false);
  const [groupMode, setGroupMode]     = useState(false);
  const [members, setMembers]         = useState([{ name: "You (host)" }]);
  const [newMember, setNewMember]     = useState("");
  const [cartItems, setCartItems]     = useState(cart);

  useEffect(() => { setCartItems(cart); }, [cart]);

  useEffect(() => {
  if (mode === "delivery") { setEcoContainer(false); setPreorder(false); }
}, [mode]);
  
  const km          = parseKm(centreDistance);
  const deliveryFee = mode === "delivery" ? getDeliveryFee(km) : 0;
  const subtotal    = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const ecoDisc     = ecoContainer ? 0.30 : 0;
  const total       = subtotal + deliveryFee - ecoDisc;
  const isToday     = selDate === todayISO();
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes()/60;
  const times = isToday 
    ? PICKUP_TIMES_TODAY.filter(t => {
        if (t === "Now (~15 min)") return true;
        const [h, m] = t.replace(" AM","").replace(" PM","").split(":").map(Number);
        const isPM = t.includes("PM") && h !== 12;
        const hour = isPM ? h + 12 : (t.includes("AM") && h === 12 ? 0 : h);
        return hour + (m||0)/60 > currentHour + 0.25;
      })
    : PICKUP_TIMES_ADV;

  const dateOpts = [
    { label: "Today", value: todayISO() },
    ...Array.from({ length: 5 }).map((_, i) => {
      const d = addDays(todayISO(), i + 1);
      return { label: fmtShort(d), value: d };
    }),
  ];

  function changeQty(idx, delta) {
    setCartItems((c) => {
      const n = [...c];
      n[idx] = { ...n[idx], qty: Math.max(0, n[idx].qty + delta) };
      return n.filter((x) => x.qty > 0);
    });
  }

  function addMember() {
    if (newMember.trim()) {
      setMembers((m) => [...m, { name: newMember.trim() }]);
      setNewMember("");
    }
  }

  return (
    <div className="cart-ovl" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cpanel">

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <div className="ctitle">Your Order</div>
            <div className="csub">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 17, color: "var(--ink3)" }}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty" style={{ flex: 1 }}>
            <div className="empty-ico">🧺</div>
            <div className="empty-title">Cart is empty</div>
            <p style={{ fontStyle: "italic" }}>Add dishes to get started.</p>
          </div>
        ) : (
          <>
            {/* ITEMS */}
            {cartItems.map((item, i) => (
              <div key={i} className="citem">
                <div className="citem-name">{item.name}</div>
                <div className="citem-stall">{item.stallName}</div>
                <div className="cqty">
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <button className="qbtn" onClick={() => changeQty(i, -1)}>−</button>
                    <span style={{ fontWeight: 500, minWidth: 14, textAlign: "center" }}>{item.qty}</span>
                    <button className="qbtn" onClick={() => changeQty(i, 1)}>+</button>
                  </div>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}

            {/* GROUP ORDER */}
            <div className="csec">Group order</div>
            <div
              className={`toggle-row ${groupMode ? "blue-on" : ""}`}
              style={!groupMode ? { borderColor: "var(--border)", color: "var(--ink3)" } : {}}
              onClick={() => setGroupMode((g) => !g)}
            >
              <span style={{ fontSize: 16 }}>👥</span>
              <div>
                <div style={{ fontWeight: 500 }}>Group order</div>
                <div style={{ fontSize: 11, opacity: .8 }}>Order together, pick up together</div>
              </div>
              <span style={{ marginLeft: "auto", fontWeight: 500 }}>{groupMode ? "✓ On" : "○"}</span>
            </div>
            {groupMode && (
              <div className="group-box">
                <div style={{ fontFamily: "var(--ff-d)", fontSize: 13, fontWeight: 700, marginBottom: 7 }}>
                  👥 Group ({members.length})
                </div>
                {members.map((m, i) => (
                  <div key={i} className="group-member">
                    <span>{m.name}</span>
                    {i === 0 ? (
                      <span style={{ fontSize: 10, color: "var(--amber)" }}>host</span>
                    ) : (
                      <button
                        onClick={() => setMembers((gm) => gm.filter((_, j) => j !== i))}
                        style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 11 }}
                      >remove</button>
                    )}
                  </div>
                ))}
                <input
                  className="ginput"
                  placeholder="Add member name…"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                />
                <button className="gadd" onClick={addMember}>+ Add member</button>
              </div>
            )}

            {/* COLLECTION MODE */}
            <div className="csec">Collection method</div>
            <div className="ogrp">
              <button className={`obtn ${mode === "pickup" ? "on" : ""}`} onClick={() => setMode("pickup")}>🏃 Pick-up</button>
              <button className={`obtn ${mode === "delivery" ? "on" : ""}`} onClick={() => setMode("delivery")}>🛵 Delivery</button>
            </div>

            {/* PRE-ORDER — pickup only */}
{mode === "pickup" && <>
<div className="csec">Schedule</div>
<div className={`toggle-row ${preorder ? "amber-on" : ""}`}
  style={!preorder ? { borderColor: "var(--border)", color: "var(--ink3)" } : {}}
  onClick={() => setPreorder((p) => !p)}
>
  <span style={{ fontSize: 16 }}>📅</span>
  <div>
    <div style={{ fontWeight: 500 }}>Pre-order for another day</div>
    <div style={{ fontSize: 11, opacity: .8 }}>Schedule up to 5 days ahead</div>
  </div>
  <span style={{ marginLeft: "auto", fontWeight: 500 }}>{preorder ? "✓" : "○"}</span>
</div>
{preorder && (
  <div className="dgrid">
    {dateOpts.map((d) => (
      <button key={d.value} className={`dchip ${selDate === d.value ? "on" : ""}`} onClick={() => setSelDate(d.value)}>
        {d.label}
      </button>
    ))}
  </div>
)}
<select className="sel" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)}>
  {times.map((t) => <option key={t}>{t}</option>)}
</select>
{!isToday && (
  <div style={{ fontSize: 12, color: "var(--amber)", fontStyle: "italic", marginBottom: 10 }}>
    📅 Scheduled for {fmtShort(selDate)} at {pickupTime}
  </div>
)}
{isToday && (
  <div style={{ fontSize: 11, color: "var(--ink3)", fontStyle: "italic", marginBottom: 10 }}>
    We'll remind you every hour until collected.
  </div>
)}
</>}
    

            {/* ECO CONTAINER — only for pickup */}
{mode === "pickup" && <>
<div className="csec">Eco options</div>
<div className={`toggle-row ${ecoContainer ? "eco-on" : ""}`}
  style={!ecoContainer ? { borderColor: "var(--border)", color: "var(--ink3)" } : {}}
  onClick={() => setEcoContainer((e) => !e)}
>
  <span style={{ fontSize: 16 }}>🌿</span>
  <div>
    <div style={{ fontWeight: 500 }}>Eco Container — bring your own</div>
    <div style={{ fontSize: 11, opacity: .8 }}>Save $0.30 · reduce single-use waste</div>
  </div>
  <span style={{ marginLeft: "auto", fontWeight: 500 }}>{ecoContainer ? "✓" : "○"}</span>
</div>
</>}

            {/* CARBON-LITE BANNER */}
            {mode === "pickup" ? (
              <div className="carbon green">
                🌍 <span>Pick-up saves ~120g CO₂ vs delivery. Thank you for the greener choice.</span>
              </div>
            ) : (
              <div className="carbon blue">
                🚲 <span>Our riders use e-bikes where possible. Est. ~80g CO₂ for this delivery.</span>
              </div>
            )}

            {/* ORDER SUMMARY */}
            <div className="csum">
              <div className="srow"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {mode === "delivery" && (
                <div className="srow"><span>Delivery ({km.toFixed(1)} km)</span><span>${deliveryFee.toFixed(2)}</span></div>
              )}
              {ecoContainer && (
                <div className="srow" style={{ color: "var(--green)" }}>
                  <span>🌿 Eco container</span><span>−$0.30</span>
                </div>
              )}
              {groupMode && members.length > 1 && (
                <div className="srow" style={{ color: "var(--ink3)", fontStyle: "italic" }}>
                  <span>Split {members.length} ways</span>
                  <span>~${(total / members.length).toFixed(2)}/person</span>
                </div>
              )}
              <div className="stot"><span>Total</span><span>${total.toFixed(2)}</span></div>
              <button
                className="chkbtn"
                onClick={() => {
  onOrder(mode, pickupTime, selDate, ecoContainer, groupMode ? members.map(m => m.name) : [], cartItems);
}}
              >
                {preorder && !isToday ? `Schedule for ${fmtShort(selDate)}` : "Confirm Order →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}