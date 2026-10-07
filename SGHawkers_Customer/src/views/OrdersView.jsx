export default function OrdersView({ ordersHook, onReorder }) {
  const { orders, loading } = ordersHook;

  const STATUS_COLOR = {
    new:       { bg:"#fff3cd", color:"#856404" },
    preparing: { bg:"#cce5ff", color:"#004085" },
    ready:     { bg:"#d4edda", color:"#155724" },
    collected: { bg:"#e2e3e5", color:"#383d41" },
    delivered: { bg:"#e2e3e5", color:"#383d41" },
    cancelled: { bg:"#f8d7da", color:"#721c24" },
  };

  return (
    <div className="sec">
      <div className="stitle">Your Orders</div>
      <div className="ssub">Live status + full history</div>
      <div className="dvdr" />

      {loading ? (
        <div style={{ color:"var(--ink3)", fontStyle:"italic" }}>Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="empty">
          <div className="empty-ico">📋</div>
          <div className="empty-title">No orders yet</div>
          <p style={{ fontStyle:"italic" }}>Place your first order to see it here.</p>
        </div>
      ) : orders.map(o => {
        const sc = STATUS_COLOR[o.status] || STATUS_COLOR.new;
        const items = Array.isArray(o.items) ? o.items : [];
        return (
          <div key={o.id} className="ocrd">
            <div className="ohdr">
              <div>
                <div className="oid">{o.order_ref} · {new Date(o.created_at).toLocaleDateString("en-SG")}</div>
                <div className="ostall">{o.stall_name} · {o.centre_name}</div>
              </div>
              <span className="ostatus" style={{ background:sc.bg, color:sc.color }}>
                {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
              </span>
            </div>
            <div className="oitems">{items.map(i => `${i.qty}× ${i.name}`).join(", ")}</div>

{["new","preparing","ready"].includes(o.status) && (() => {
  const steps = o.order_type === "delivery"
    ? ["new","preparing","out_for_delivery","delivered"]
    : ["new","preparing","ready","collected"];
  const labels = o.order_type === "delivery"
    ? ["Order Placed","Preparing","Out for Delivery","Delivered"]
    : ["Order Placed","Preparing","Ready","Collected"];
  const cur = steps.indexOf(o.status);
  return (
    <div style={{ display:"flex",alignItems:"center",gap:0,margin:"12px 0 4px",position:"relative" }}>
      {steps.map((s,i) => (
        <div key={s} style={{ display:"flex",alignItems:"center",flex:i<steps.length-1?1:"none" }}>
          <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
            <div style={{ width:22,height:22,borderRadius:"50%",background:i<=cur?"var(--amber)":"var(--paper3)",border:`2px solid ${i<=cur?"var(--amber)":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:i<=cur?"#fff":"var(--ink3)",fontWeight:700,flexShrink:0 }}>
              {i<cur?"✓":i+1}
            </div>
            <span style={{ fontSize:9,color:i<=cur?"var(--amber)":"var(--ink3)",textAlign:"center",whiteSpace:"nowrap",fontFamily:"var(--ff-s)",textTransform:"uppercase",letterSpacing:.5 }}>{labels[i]}</span>
          </div>
          {i<steps.length-1 && <div style={{ flex:1,height:2,background:i<cur?"var(--amber)":"var(--border)",margin:"0 4px",marginBottom:16 }}/>}
        </div>
      ))}
    </div>
  );
})()}
            <div className="oftr">
              <div>
                <div className="otot">${parseFloat(o.total).toFixed(2)}</div>
                <div style={{ fontSize:11, color:"var(--ink3)", fontStyle:"italic" }}>
                  {o.order_type === "pickup" ? "🏃 Pick-up" : o.order_type === "delivery" ? "🛵 Delivery" : "🏪 Walk-in"}
                </div>
              </div>
              {["collected","delivered"].includes(o.status) && (
                <button className="reorder" onClick={() => onReorder(o)}>Reorder →</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}