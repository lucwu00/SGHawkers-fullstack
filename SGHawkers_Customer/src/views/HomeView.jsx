import { useState } from "react";
import { DIET_LABELS } from "../utils/constants";
import { parseKm } from "../utils/helpers";

const WAIT_COLORS = { busy:"#c0392b", moderate:"#e67e22", quiet:"#27ae60" };
const WAIT_LABELS = { busy:"Busy now", moderate:"Moderate", quiet:"Quiet" };

function WaitBadge({ level }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", fontSize:12, color:WAIT_COLORS[level] }}>
      <span style={{ background:WAIT_COLORS[level], display:"inline-block", width:7, height:7, borderRadius:"50%", marginRight:4 }} />
      {WAIT_LABELS[level]}
    </span>
  );
}

const REVIEWS = [
  { user:"Priya S.", stall:"Tian Tian", text:"Best chicken rice since my grandfather used to bring me here in the 90s. Nothing has changed — that's the magic.", rating:5, date:"30 Apr" },
  { user:"Marcus T.", stall:"Wei Yi Hokkien Mee", text:"Waited 40 minutes. Worth every second. The lard fragrance hits from across the hawker centre.", rating:5, date:"29 Apr" },
  { user:"Aisyah R.", stall:"Newton Satay", text:"Great for late-night cravings. Peanut sauce is thick and rich.", rating:4, date:"28 Apr" },
];

export default function HomeView({ centres, centresLoading, hotDishes, onCentre, toast, ordersHook, onViewOrders }) {
  const [search, setSearch]   = useState("");
  const [dietary, setDietary] = useState([]);
  const [nearMe, setNearMe]   = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [suggestion, setSuggestion] = useState("");
  const [suggSent, setSuggSent]     = useState(false);

  function toggleDiet(k) { setDietary(d => d.includes(k) ? d.filter(x => x!==k) : [...d, k]); }

  const filtered = centres.filter(c => {
    const q  = search.toLowerCase();
    const mq = !q || c.name.toLowerCase().includes(q) || (c.area||"").toLowerCase().includes(q);
    const md = dietary.every(d => (c.dietary_tags||[]).includes(d));
    const mn = !nearMe || parseKm(c.distance_km) <= 2;
    return mq && md && mn;
  });

  function calcDistKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

  const sorted = nearMe && userCoords
    ? [...filtered].sort((a,b) =>
        calcDistKm(userCoords.lat, userCoords.lng, parseFloat(a.lat), parseFloat(a.lon)) -
        calcDistKm(userCoords.lat, userCoords.lng, parseFloat(b.lat), parseFloat(b.lon)))
    : filtered;

  return (
    <div>
      {/* ── ACTIVE ORDER TRACKER ─────────────────────────────────────── */}
{(() => {
  const activeOrders = (ordersHook?.orders || []).filter(o => ["new","preparing","ready","out_for_delivery"].includes(o.status));
  if (!activeOrders.length) return null;
  const [expanded, setExpanded] = useState(false);
  const o = activeOrders[0];
  const steps = o.order_type === "delivery"
    ? ["new","preparing","out_for_delivery","delivered"]
    : ["new","preparing","ready","collected"];
  const labels = o.order_type === "delivery"
    ? ["Placed","Preparing","On the way","Delivered"]
    : ["Placed","Preparing","Ready","Collected"];
  const cur = steps.indexOf(o.status);
  return (
    <div style={{ position:"fixed",bottom:20,right:20,zIndex:150,width:expanded?320:200,background:"var(--ink)",color:"var(--paper)",borderRadius:"var(--rl)",border:"2px solid var(--amber)",boxShadow:"var(--shadow-lg)",transition:"width .3s",overflow:"hidden" }}>
      <div style={{ padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",borderBottom:expanded?"1px solid rgba(200,134,10,.3)":"none" }} onClick={() => setExpanded(e => !e)}>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:16 }}>🛵</span>
          <div>
            <div style={{ fontFamily:"var(--ff-d)",fontSize:12,fontWeight:700,color:"var(--amber2)" }}>
              {activeOrders.length} Active Order{activeOrders.length>1?"s":""}
            </div>
            {!expanded && <div style={{ fontSize:10,color:"var(--paper3)",fontStyle:"italic" }}>{o.status.replace("_"," ")}</div>}
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
                <div style={{ display:"flex",alignItems:"center",gap:0,position:"relative" }}>
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
})()}
      {/* HERO */}
      <div className="hero">
        <div className="hero-eye">Singapore's Hawker Heritage — Order &amp; Collect</div>
        <h1 className="hero-h">Every Plate,<br /><em>A Story Told.</em></h1>
        <p className="hero-sub">From Uncle's chicken rice at Maxwell to Mdm Ang's chwee kueh at Tiong Bahru — taste Singapore's soul, one hawker at a time.</p>
        <div className="hero-btns">
          <button className="hero-cta" onClick={() => document.getElementById("cs-sec")?.scrollIntoView({behavior:"smooth"})}>Order Now</button>
          <button className="hero-cta2" onClick={() => { setNearMe(true); document.getElementById("cs-sec")?.scrollIntoView({behavior:"smooth"}); }}>📍 Near Me</button>
        </div>
        <div className="hero-stats">
          <div><div className="hstat-v">114</div><div className="hstat-l">Hawker Centres</div></div>
          <div><div className="hstat-v">6,000+</div><div className="hstat-l">Stalls</div></div>
          <div><div className="hstat-v">$3.50</div><div className="hstat-l">Avg meal</div></div>
          <div><div className="hstat-v">4.8★</div><div className="hstat-l">Rating</div></div>
        </div>
      </div>

      {/* HOT DISHES */}
      {hotDishes.length > 0 && (
        <div className="sec">
          <div className="stitle">🔥 What's Hot Today</div>
          <div className="ssub">Most ordered dishes across Singapore this morning</div>
          <div className="dvdr" />
          <div className="hscr">
            {hotDishes.map((d,i) => (
              <div key={i} className="dcrd" onClick={() => toast(`${d.name} — at ${d.centre_name}`)}>
                {d.is_hot && <span className="hot-bdg">Hot</span>}
                <span className="demoji">{d.image_emoji || "🍽"}</span>
                <div className="dname">{d.name}</div>
                <div className="dorg">{d.stall_name} · {d.centre_name}</div>
                <div className="dprice">from ${parseFloat(d.price).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ECO BANNER */}
      <div className="eco-banner" style={{ flexDirection:"column", textAlign:"center", alignItems:"center" }}>
  <div className="eco-ico" style={{ fontSize:32, marginBottom:8 }}>🌿</div>
  <div className="eco-title">SGHawkers goes green</div>
  <div className="eco-desc">Bring your own container for $0.30 off. Pick-up saves ~120g CO₂ per order.</div>
</div>

      {/* CENTRES */}
      <div className="sec" id="cs-sec">
        <div className="stitle">Browse Hawker Centres</div>
        <div className="ssub">{centres.length} centres available</div>
        <div className="dvdr" />

        {!nearMe ? (
          <div className="nmbar">
            <span>📍</span><span>Find hawker centres closest to you</span>
            <button onClick={() => {
              navigator.geolocation.getCurrentPosition(
                pos => {
                  setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                  setNearMe(true);
                  toast("Showing nearest first");
                },
                () => toast("Location access denied — enable in browser settings", "error")
              );
            }}>Enable Near Me</button>
          </div>
        ) : (
          <div className="nmbar" style={{ background:"linear-gradient(90deg,#2d5a27,#4a7c3f)" }}>
            <span>📍</span><span>Showing nearest centres first</span>
            <button onClick={() => { setNearMe(false); setUserCoords(null); }}>Clear</button>
          </div>
        )}

        {/* DIETARY FILTERS */}
        <div className="frow">
          <span className="flabel">Diet:</span>
          {["halal","vegetarian","vegan"].map(k => (
            <button key={k} className={`chip ${dietary.includes(k)?"on":""}`} onClick={() => toggleDiet(k)}>{DIET_LABELS[k]}</button>
          ))}
        </div>

        {/* SEARCH */}
        <div className="srch">
          <span className="srch-ico">🔍</span>
          <input className="srch-in" placeholder="Search centres, areas…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {centresLoading ? (
          <div style={{ textAlign:"center", padding:40, color:"var(--ink3)", fontStyle:"italic" }}>Loading centres…</div>
        ) : (
          <div className="cgrid">
            {sorted.map(c => (
              <div key={c.id} className="ccrd" onClick={() => onCentre(c)}>
                <div className="cemoji">{c.image_emoji}</div>
                <div className="cname">{c.name}</div>
                <div className="carea">{c.area}</div>
                <div className="cmeta">
                  <span>📍 {parseFloat(c.distance_km).toFixed(1)} km</span>
                  <span>🏪 {c.total_stalls || c.stall_count}</span>
                  <WaitBadge level={c.wait_time} />
                  {c.eco && <span className="ecoleaf">🌿 Eco</span>}
                </div>
                {(c.dietary_tags||[]).length > 0 && (
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:8 }}>
                    {(c.dietary_tags||[]).map(d => <span key={d} className="dpill">{DIET_LABELS[d]||d}</span>)}
                  </div>
                )}
                <div className="rrow" style={{ marginTop:9 }}>
                  <span className="rstar">★</span>
                  <span style={{ fontWeight:500, fontSize:13, color:"var(--ink)" }}>{parseFloat(c.avg_rating||c.rating||0).toFixed(1)}</span>
                </div>
              </div>
            ))}
            {sorted.length === 0 && (
              <div className="empty" style={{ gridColumn:"1/-1" }}>
                <div className="empty-ico">🔍</div>
                <div className="empty-title">No centres found</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* REVIEWS */}
      <div className="sec" style={{ background:"var(--paper2)" }}>
        <div className="stitle">What Singaporeans Are Saying</div>
        <div className="ssub">Real reviews, openly published</div>
        <div className="dvdr" />
        {REVIEWS.map((r,i) => (
          <div key={i} className="rcrd">
            <div className="ruser">{r.user}</div>
            <div className="rstall">{r.stall}</div>
            <div className="rtext">"{r.text}"</div>
            <div className="rmeta">
              <span className="stars">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
              <span className="rdate">{r.date}</span>
            </div>
          </div>
        ))}
        <div className="sbox">
          <div style={{ fontSize:12, color:"var(--ink3)", fontStyle:"italic", marginBottom:7 }}>Have a suggestion?</div>
          {suggSent ? (
            <div style={{ color:"var(--green)", fontStyle:"italic", fontSize:13 }}>🙏 Thank you!</div>
          ) : (
            <>
              <input className="sin" placeholder="Share a stall we should add…" value={suggestion} onChange={e => setSuggestion(e.target.value)} />
              <button className="sbtn" onClick={() => { if(suggestion.trim()) { setSuggSent(true); setSuggestion(""); } }}>Send</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}