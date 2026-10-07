import { todayISO, fmtShort } from "../utils/helpers";

// ─── ORDER CONFIRM ────────────────────────────────────────────────────────────
export default function OrderConfirm({ mode, pickupTime, orderDate, ecoContainer, onClose }) {
  const isToday = orderDate === todayISO();
  const steps =
    mode === "pickup"
      ? ["Order placed", "Preparing", "Ready for pick-up"]
      : ["Order placed", "Preparing", "Out for delivery", "Delivered"];

  return (
    <div className="conf-ovl">
      <div className="conf-card">
        <div className="conf-ico">{isToday ? "🎉" : "📅"}</div>
        <div className="conf-title">{isToday ? "Order Confirmed!" : "Pre-order Scheduled!"}</div>
        <div className="conf-sub">
          {isToday
            ? mode === "pickup"
              ? `Ready at ${pickupTime}. We'll remind you when it's ready.`
              : "Your order is being prepared. Estimated delivery in 30–45 minutes."
            : `Scheduled for ${fmtShort(orderDate)} at ${pickupTime}. Reminders start at 8am that day, every 4 hours until collected.`}
        </div>

        {isToday && (
          <div className="sbar">
            {steps.map((s, i) => (
              <div key={s} className="sstep">
                <div className={`sdot ${i === 0 ? "done" : i === 1 ? "cur" : ""}`}>
                  {i === 0 ? "✓" : i + 1}
                </div>
                <div className="slbl">{s}</div>
              </div>
            ))}
          </div>
        )}

        {ecoContainer && (
          <div style={{ background: "#e8f5e3", border: "1px solid var(--green)", borderRadius: "var(--r)", padding: "8px 11px", fontSize: 12, color: "var(--green)", marginBottom: 14, textAlign: "left" }}>
            🌿 Eco container noted! $0.30 saved. One fewer plastic container today.
          </div>
        )}

        {!isToday && (
          <div style={{ background: "#fff8e8", border: "1px solid var(--amber)", borderRadius: "var(--r)", padding: "8px 11px", fontSize: 12, color: "var(--amber2)", marginBottom: 14, textAlign: "left" }}>
            📅 You'll get a morning reminder on {fmtShort(orderDate)} to confirm your order is still on.
          </div>
        )}

        <div style={{ fontSize: 12, color: "var(--ink3)", fontStyle: "italic", marginBottom: 20 }}>
          Supporting local hawkers and Singapore's heritage — one order at a time. 🇸🇬
        </div>

        <button className="done-btn" onClick={onClose}>Back to SGHawkers</button>
      </div>
    </div>
  );
}