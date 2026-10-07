import { useState, useRef, useCallback, useEffect } from "react";
import { CSS } from "./styles/global";
import {
  useAuth,
  useCentres,
  usePopularDishes,
  useOrders,
  useNotifications,
  useFavourites,
} from "./hooks/useApi";
import { useWebSocket } from "./hooks/useWebSocket";

import { Toast } from "./components/UI";
import AuthModal     from "./components/AuthModal";
import NotifPanel    from "./components/NotifPanel";
import CartPanel     from "./components/CartPanel";
import OrderConfirm  from "./components/OrderConfirm";

import HomeView       from "./views/HomeView";
import CentreView     from "./views/CentreView";
import StallView      from "./views/StallView";
import FavouritesView from "./views/FavouritesView";
import OrdersView     from "./views/OrdersView";

function ActiveOrderTracker({ ordersHook, onViewOrders }) {
  const [expanded, setExpanded] = useState(false);
  const activeOrders = (ordersHook?.orders || []).filter(o =>
    ["new","preparing","ready","out_for_delivery"].includes(o.status)
  );
  if (!activeOrders.length) return null;

  const o = activeOrders[0];
  const steps = o.order_type === "delivery"
    ? ["new","preparing","out_for_delivery","delivered"]
    : ["new","preparing","ready","collected"];
  const labels = o.order_type === "delivery"
    ? ["Placed","Preparing","On the way","Delivered"]
    : ["Placed","Preparing","Ready","Collected"];

  return (
    <div style={{ position:"fixed",bottom:20,right:20,zIndex:150,width:expanded?320:200,background:"var(--ink)",color:"var(--paper)",borderRadius:"var(--rl)",border:"2px solid var(--amber)",boxShadow:"var(--shadow-lg)",transition:"width .3s",overflow:"hidden" }}>
      <div style={{ padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",borderBottom:expanded?"1px solid rgba(200,134,10,.3)":"none" }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:16 }}>🛵</span>
          <div>
            <div style={{ fontFamily:"var(--ff-d)",fontSize:12,fontWeight:700,color:"var(--amber2)" }}>
              {activeOrders.length} Active Order{activeOrders.length>1?"s":""}
            </div>
            {!expanded && <div style={{ fontSize:10,color:"var(--paper3)",fontStyle:"italic" }}>{o.status.replace(/_/g," ")}</div>}
          </div>
        </div>
        <span style={{ color:"var(--amber)",fontSize:12 }}>{expanded?"▼":"▲"}</span>
      </div>
      {expanded && (
        <div style={{ padding:"12px 14px",maxHeight:300,overflowY:"auto" }}>
          {activeOrders.map(ord => {
            const s = steps.indexOf(ord.status);
            return (
              <div key={ord.id} style={{ marginBottom:14,paddingBottom:14,borderBottom:"1px solid rgba(200,134,10,.2)" }}>
                <div style={{ fontFamily:"var(--ff-d)",fontSize:12,fontWeight:700,marginBottom:2 }}>{ord.stall_name}</div>
                <div style={{ fontSize:10,color:"var(--paper3)",fontStyle:"italic",marginBottom:8 }}>{ord.order_ref} · {(ord.items||[]).map(i=>`${i.qty}× ${i.name}`).join(", ")}</div>
                <div style={{ display:"flex",alignItems:"center",position:"relative" }}>
                  {steps.map((step,i) => (
                    <div key={step} style={{ display:"flex",alignItems:"center",flex:i<steps.length-1?1:"none" }}>
                      <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                        <div style={{ width:18,height:18,borderRadius:"50%",background:i<=s?"var(--amber)":"rgba(255,255,255,.15)",border:`1.5px solid ${i<=s?"var(--amber)":"rgba(255,255,255,.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:i<=s?"var(--ink)":"var(--paper3)",fontWeight:700,flexShrink:0 }}>
                          {i<s?"✓":i+1}
                        </div>
                        <span style={{ fontSize:8,color:i<=s?"var(--amber2)":"var(--paper3)",textAlign:"center",whiteSpace:"nowrap",textTransform:"uppercase",letterSpacing:.3 }}>{labels[i]}</span>
                      </div>
                      {i<steps.length-1 && <div style={{ flex:1,height:1.5,background:i<s?"var(--amber)":"rgba(255,255,255,.15)",margin:"0 3px",marginBottom:14 }}/>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <button onClick={onViewOrders} style={{ width:"100%",background:"var(--amber)",color:"var(--ink)",border:"none",padding:"7px",borderRadius:"var(--r)",fontFamily:"var(--ff-d)",fontSize:12,fontWeight:700,cursor:"pointer",marginTop:4 }}>
            View All Orders →
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const auth        = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [view, setView]         = useState("home");
  const [selCentre, setSelCentre] = useState(null);
  const [selStall,  setSelStall]  = useState(null);

  // ── Live data hooks ─────────────────────────────────────────────────────────
  const { data: centres, loading: centresLoading } = useCentres();
  const { data: hotDishes }                        = usePopularDishes();
  const ordersHook   = useOrders();
  const notifHook    = useNotifications();
  const favsHook     = useFavourites();

  // ── Cart local state (items before placing) ──────────────────────────────────
  const [cart, setCart]         = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  // ── Notifications panel ──────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);


  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toastMsg,  setToastMsg]  = useState("");
  const [toastType, setToastType] = useState("");
  const toastTimer  = useRef(null);
  

  function toast(msg, type = "") {
    setToastMsg(msg); setToastType(type);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(""), 2400);
  }

  // ── WebSocket — real-time events from server ─────────────────────────────────
  const handleWsMessage = useCallback((msg) => {
    switch (msg.type) {
      case "order_status_updated":
        ordersHook.updateOrderFromWs(msg.order);
        toast(`Order ${msg.order.order_ref}: ${msg.order.status}`, "success");
        break;
      case "notification":
        notifHook.addNotification(msg.notification);
        break;
      case "menu_updated":
        // StallView listens via its own useMenu hook — no action needed here
        break;
      default: break;
    }
  }, [ordersHook, notifHook]);

  useWebSocket(handleWsMessage, auth.isLoggedIn);

  useEffect(() => {
  if (view === "orders") ordersHook.refetch?.();
}, [view]);

useEffect(() => {
  const hasActive = ordersHook.orders?.some(o =>
    ["new","preparing","ready","out_for_delivery"].includes(o.status)
  );
  if (!hasActive) return;
  const interval = setInterval(() => { ordersHook.refetch?.(); }, 30000);
  return () => clearInterval(interval);
}, [ordersHook.orders]);

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  function addToCart(item, stall) {
    setCart(c => {
      const idx = c.findIndex(x => x.id === item.id);
      if (idx >= 0) {
        const n = [...c]; n[idx] = { ...n[idx], qty: n[idx].qty + 1 }; return n;
      }
      return [...c, { ...item, qty: 1, stallName: stall.name, stallId: stall.id, stallSlug: stall.slug }];
    });
  }

  // ── Place order ──────────────────────────────────────────────────────────────
  async function handleOrder(mode, pickupTime, orderDate, ecoContainer, groupMembers = [], cartItems) {
  if (!auth.isLoggedIn) { setCartOpen(false); setAuthOpen(true); return; }
  try {
    const itemsToOrder = cartItems || cart;
    const stallId  = itemsToOrder[0]?.stallId;
    const centreId = selCentre?.id;
    const subtotal = itemsToOrder.reduce((s, i) => s + i.price * i.qty, 0);
    const ecoDisc  = ecoContainer ? 0.30 : 0;
    const delFee   = mode === "delivery" ? 2.50 : 0;
    const total    = subtotal + delFee - ecoDisc;

    const order = await ordersHook.placeOrder({
      stallId,
      centreId,
      items: itemsToOrder.map(i => ({
        menuItemId: i.id,
        name:       i.name,
        qty:        i.qty,
        unitPrice:  i.price,
      })),
      orderType:     mode === "walkin" ? "walkin" : mode,
      subtotal,
      deliveryFee:   delFee,
      ecoDiscount:   ecoDisc,
      total,
      ecoContainer,
      scheduledDate: orderDate,
      scheduledTime: pickupTime,
      prepMins: 15,
      note: groupMembers.length > 1 ? `Group order: ${groupMembers.join(", ")}` : "",
    });

    setCart([]);
    setCartOpen(false);
    setConfirmed({ mode, pickupTime, orderDate, ecoContainer, order });
    notifHook.addNotification({ icon:"🎉", title:"Order placed!", body:`Your order is being prepared.`, is_read:false });
    toast("Order placed!", "success");
  } catch (err) {
    toast(err.message || "Failed to place order", "error");
  }
}

  // ── Reorder ──────────────────────────────────────────────────────────────────
  async function handleReorder(order) {
    if (!auth.isLoggedIn) { setAuthOpen(true); return; }
    // Re-add past order items to cart
    const newItems = (order.items || []).map(i => ({
      id:        i.menuItemId || i.menu_item_id,
      name:      i.name,
      price:     parseFloat(i.unit_price || i.unitPrice),
      qty:       i.qty,
      stallName: order.stall_name,
      stallId:   order.stall_id,
      stallSlug: order.stall_slug,
    })).filter(i => i.id && i.price > 0);

    if (!newItems.length) { toast("Items no longer available", "error"); return; }
    setCart(newItems);
    setView("home");
    setCartOpen(true);
    toast(`Reordered from ${order.stall_name}`, "success");
  }

  const cartCount  = cart.reduce((s, i) => s + i.qty, 0);
  const unread     = notifHook.unreadCount;

  function navHome() {
    setView("home"); setSelCentre(null); setSelStall(null); setNotifOpen(false);
  }

  return (
    <>
      <style>{CSS}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="hdr">
        <div className="logo" onClick={navHome}>SG<span>Hawkers</span></div>
        <div className="hdr-nav">
          <button className={`nav-btn ${view==="home"?"on":""}`} onClick={navHome}>Discover</button>
          <button className={`nav-btn ${view==="favourites"?"on":""}`} onClick={() => { setView("favourites"); setNotifOpen(false); }}>
            Favourites
          </button>
          <button className={`nav-btn ${view==="orders"?"on":""}`} onClick={() => {
            if (!auth.isLoggedIn) { setAuthOpen(true); return; }
            setView("orders"); setNotifOpen(false);
          }}>
            Orders
          </button>

          {auth.isLoggedIn ? (
  <>
    <span className="nav-btn" style={{ cursor:"default", color:"var(--amber)", fontSize:13 }}>
      👤 {auth.customer?.name?.split(" ")[0] || "Account"}
    </span>
    <button className="nav-btn" onClick={auth.logout}>Logout</button>
  </>
          ) : (
            <button className="nav-btn" onClick={() => setAuthOpen(true)}>Login</button>
          )}

          <button className="notif-btn" onClick={() => setNotifOpen(o => !o)}>
            🔔{unread > 0 && <em className="nbadge">{unread}</em>}
          </button>
          <button className="cart-btn" onClick={() => { setCartOpen(true); setNotifOpen(false); }}>
            🧺{cartCount > 0 && <em className="cbadge">{cartCount}</em>}
          </button>
        </div>
      </div>

      {/* ── NOTIFICATIONS ──────────────────────────────────────────────── */}
      {notifOpen && (
        <NotifPanel
          notifs={notifHook.notifs}
          onClose={() => setNotifOpen(false)}
          onMarkAll={notifHook.markAllRead}
        />
      )}

      {/* ── VIEWS ──────────────────────────────────────────────────────── */}
      {view === "home" && !selCentre && (
        <HomeView
          centres={centres || []}
          centresLoading={centresLoading}
          hotDishes={hotDishes || []}
          onCentre={c => { setSelCentre(c); setSelStall(null); setNotifOpen(false); }}
          toast={toast}
        />
      )}
      {view === "home" && selCentre && !selStall && (
        <CentreView
          centre={selCentre}
          onStall={s => setSelStall(s)}
          onBack={() => setSelCentre(null)}
        />
      )}
      {view === "home" && selCentre && selStall && (
        <StallView
          stallSlug={selStall.slug}
          centre={selCentre}
          onBack={() => setSelStall(null)}
          addToCart={addToCart}
          favsHook={favsHook}
          isLoggedIn={auth.isLoggedIn}
          toast={toast}
        />
      )}
      {view === "favourites" && (
        <FavouritesView
          favsHook={favsHook}
          isLoggedIn={auth.isLoggedIn}
          onLogin={() => setAuthOpen(true)}
          onGoToStall={(stall, centre) => {
            setSelCentre(centre);
            setSelStall(stall);
            setView("home");
        }}
        />
    )}
      {view === "orders" && (
        <OrdersView ordersHook={ordersHook} onReorder={handleReorder} />
      )}

      {/* ── CART ───────────────────────────────────────────────────────── */}
      {cartOpen && (
        <CartPanel
          cart={cart}
          onClose={() => setCartOpen(false)}
          onOrder={handleOrder}
          centreDistance={selCentre?.distance_km}
          isLoggedIn={auth.isLoggedIn}
          onLoginRequired={() => { setCartOpen(false); setAuthOpen(true); }}
        />
      )}

      {/* ── ORDER CONFIRM ──────────────────────────────────────────────── */}
      {confirmed && (
        <OrderConfirm
          {...confirmed}
          onClose={() => { setConfirmed(null); setView("orders"); setSelCentre(null); setSelStall(null); }}
        />
      )}

      {/* ── AUTH MODAL ─────────────────────────────────────────────────── */}
      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={() => { setAuthOpen(false); toast("Welcome back!", "success"); }}
          auth={auth}
        />
      )}

      <ActiveOrderTracker
        ordersHook={ordersHook}
        onViewOrders={() => { setView("orders"); setNotifOpen(false); }}
      />

      <Toast msg={toastMsg} type={toastType} />
    </>
  );
}