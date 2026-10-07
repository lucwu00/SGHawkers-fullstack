import { useState, useEffect } from "react";
import { useStall, useMenu } from "../hooks/useApi";
import { useWebSocket } from "../hooks/useWebSocket";
import { DIET_LABELS } from "../utils/constants";
import { api } from "../api/client";

export default function StallView({ stallSlug, centre, onBack, addToCart, favsHook, isLoggedIn, toast }) {
  const { data: stallData, loading } = useStall(stallSlug);
  const menuHook = useMenu(stallData?.stall?.id);
  const [showBio, setShowBio]     = useState(false);
  const [dietFilter, setDietFilter] = useState([]);
  const [promos, setPromos] = useState([]);
  const [lightbox, setLightbox] = useState(null); // holds the image_urls[0] when open
  useEffect(() => {
    if (!stallData?.stall?.id) return;
    api.get(`/hawker/promos/${stallData.stall.id}`)
      .then(data => setPromos(data.filter(p => p.is_active)))
      .catch(() => {});
  }, [stallData?.stall?.id]);

  // Live menu updates from hawker dashboard via WebSocket
  useWebSocket((msg) => {
    if (msg.type === "menu_updated" && stallData?.stall?.id === msg.stallId) {
      menuHook.applyMenuUpdate(msg.item);
    }
  }, true);

  if (loading) return <div style={{ textAlign:"center", padding:48, color:"var(--ink3)", fontStyle:"italic" }}>Loading stall…</div>;
  if (!stallData) return null;

  const { stall, reviews } = stallData;
  const menu = menuHook.menu.length > 0 ? menuHook.menu : (stallData.menu || []);

  function toggleDiet(k) { setDietFilter(d => d.includes(k) ? d.filter(x=>x!==k) : [...d,k]); }
  const shown = dietFilter.length === 0 ? menu : menu.filter(m => dietFilter.every(d => (m.dietary_tags||[]).includes(d)));

  const isFavStall = favsHook.favStallIds.includes(stall.id);
  const loy = stall.loyalty_stamps_total ? { total:stall.loyalty_stamps_total, reward:stall.loyalty_reward } : null;

  function getSimilar(item) { return menu.find(m => m.id !== item.id && !m.is_sold_out) || null; }

  return (
    <div className="sec">
      <div className="breadcrumb">
        <span onClick={onBack} style={{ color:"var(--amber)" }}>← {centre.name}</span>
        <span>›</span>
        <span style={{ color:"var(--ink2)" }}>{stall.name}</span>
      </div>

      {/* STALL HEADER */}
      <div className="sthdr">
        <div className="stinner">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div className="stemoji">{stall.image_emoji}</div>
              <div className="stheri">Est. {stall.heritage_year}</div>
              <h2 className="stname">{stall.name}</h2>
            </div>
            {isLoggedIn && (
              <button
                className={`fav-btn ${isFavStall?"on":""}`}
                style={{ background:"rgba(255,255,255,.08)", borderColor:"rgba(255,255,255,.2)", color:isFavStall?"#e74c3c":"var(--paper3)" }}
                onClick={() => { favsHook.toggleFavStall(stall.id); toast(isFavStall?"Removed":"⭐ Stall saved!"); }}
              >
                {isFavStall?"♥ Saved":"♡ Save"}
              </button>
            )}
          </div>
          <div className="rrow" style={{ color:"var(--paper3)", marginBottom:10 }}>
            <span style={{ color:"var(--amber)" }}>★</span>
            <span style={{ color:"var(--paper)", fontWeight:500 }}>{parseFloat(stall.rating||0).toFixed(1)}</span>
            <span>({(stall.review_count||0).toLocaleString()} reviews)</span>
            {stall.eco && <span style={{ color:"#7fcf70" }}>🌿</span>}
          </div>
          {stall.story && <div className="ststory">{stall.story}</div>}
          {stall.hawker_bio && (
            <>
              <button onClick={() => setShowBio(b=>!b)} style={{ background:"none", border:"1px solid rgba(200,134,10,.3)", color:"var(--amber)", fontSize:11, padding:"4px 10px", borderRadius:"var(--r)", marginTop:11, cursor:"pointer", fontFamily:"var(--ff-s)" }}>
                {showBio?"Hide hawker profile":"Meet the hawker ▾"}
              </button>
              {showBio && (
                <div className="stbio">
                  <div className="stbio-lbl">The hawker</div>
                  <div>{stall.hawker_bio}</div>
                </div>
              )}
            </>
          )}
          {(stall.awards||[]).length > 0 && (
            <div className="award-row">{stall.awards.map(a => <span key={a} className="award">🏅 {a}</span>)}</div>
          )}
        </div>
      </div>

      {/* LOYALTY */}
      {loy && (
        <div className="loy">
          <div className="loy-title">🎟 Loyalty Stamps — {stall.name}</div>
          <div className="stamps">
            {Array.from({length:loy.total}).map((_,i) => (
              <div key={i} className="stamp">{stall.image_emoji}</div>
            ))}
          </div>
          <div className="loy-note">{loy.total} stamps for: {loy.reward}</div>
        </div>
      )}

      {promos.length > 0 && (
        <div style={{ margin:"12px 0", display:"flex", flexDirection:"column", gap:8 }}>
          {promos.map(p => (
            <div key={p.id} style={{ background:"rgba(240,165,0,.1)", border:"1px solid rgba(240,165,0,.3)", borderRadius:"var(--rl)", padding:"10px 14px", display:"flex", gap:10, alignItems:"center" }}>
              <span style={{ fontSize:16 }}>⚡</span>
              <div>
                <div style={{ fontFamily:"var(--ff-d)", fontWeight:700, fontSize:13 }}>{p.name}</div>
                <div style={{ fontSize:12, color:"var(--ink3)" }}>{p.description} · {p.start_time}–{p.end_time}</div>
              </div>
              <span style={{ marginLeft:"auto", fontFamily:"var(--ff-d)", fontWeight:700, color:"var(--amber)", fontSize:13 }}>
                {p.type==="percent" ? `${p.value}% off` : p.type==="fixed" ? `$${p.value} off` : "Free item"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* DIET FILTER */}
      <div className="frow">
        <span className="flabel">Filter menu:</span>
        {["halal","vegetarian","vegan"].map(k => (
          <button key={k} className={`chip ${dietFilter.includes(k)?"on":""}`} onClick={() => toggleDiet(k)}>{DIET_LABELS[k]}</button>
        ))}
      </div>

      <div className="stitle" style={{ fontSize:18, marginBottom:4 }}>Menu</div>
      <div className="dvdr" />

      {shown.map(item => {
        const isFavItem = favsHook.favItemIds.includes(item.id);
        const similar   = item.is_sold_out ? getSimilar(item) : null;
        const pct       = item.portions_left / (item.daily_max || 50);
        const isLow     = !item.is_sold_out && (item.stock_level === "low" || pct <= 0.25);
        return (
          <div key={item.id} className={`mitem ${item.is_sold_out?"soldout":""}`} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
            {/* Thumbnail */}
            {(item.image_urls||[]).length > 0 && (
  <img
    src={`${import.meta.env.VITE_API_URL}${item.image_urls[0].replace(/^\/api/,"")}`}
    alt={item.name}
    onClick={() => setLightbox(item.image_urls[0])}
                style={{ width:72,height:72,objectFit:"cover",borderRadius:"var(--r)",cursor:"pointer",flexShrink:0,border:"1px solid rgba(255,255,255,.1)" }}
              />
            )}
            <div className="minfo">
              <div className="mname">
                {item.name}
                {item.is_sold_out && <span className="so-b">Sold Out</span>}
                {!item.is_sold_out && item.is_hot && <span className="hot-bdg" style={{ position:"static", fontSize:8 }}>Hot</span>}
                {!item.is_sold_out && item.is_popular && <span className="pop-b">Popular</span>}
                {!item.is_sold_out && item.eco && <span className="eco-b">🌿 Eco</span>}
                {isLow && <span className="low-b">⚠ Low stock</span>}
              </div>
              <div className="mdesc">{item.description}</div>
              {item.is_sold_out && similar && (
                <div className="similar" onClick={() => toast(`Try: ${similar.name} — $${parseFloat(similar.price).toFixed(2)}`)}>
                  Sold out today — try {similar.name} instead →
                </div>
              )}
              <div className="mmeta">
                {!item.is_sold_out && <span className="mprice">${parseFloat(item.price).toFixed(2)}</span>}
                {item.calories && <span className="cal-t">{item.calories} kcal</span>}
                {(item.dietary_tags||[]).map(d => <span key={d} className="dpill">{DIET_LABELS[d]||d}</span>)}
                {!item.is_sold_out && isLoggedIn && (
                  <button className={`fav-btn ${isFavItem?"on":""}`} onClick={() => { favsHook.toggleFavItem(item.id); toast(isFavItem?"Removed":"♥ Dish saved!"); }}>
                    {isFavItem?"♥":"♡"}
                  </button>
                )}
              </div>
            </div>
            {!item.is_sold_out && (
              <button className="add-btn" onClick={() => { addToCart(item, stall); toast(`Added ${item.name}`); }}>+ Add</button>
            )}
          </div>
        );
      })}

      {/* REVIEWS */}
      {reviews?.length > 0 && (
        <div style={{ marginTop:24 }}>
          <div className="stitle" style={{ fontSize:16, marginBottom:10 }}>Reviews</div>
          {reviews.slice(0,5).map((r,i) => (
            <div key={i} className="rcrd">
              <div className="ruser">{r.customer_name || "Anonymous"}</div>
              <div className="rtext">"{r.body}"</div>
              <div className="rmeta">
                <span className="stars">{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</span>
                <span className="rdate">{new Date(r.created_at).toLocaleDateString("en-SG")}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
          <img
            src={`${import.meta.env.VITE_API_URL}${lightbox.replace(/^\/api/,"")}`}
            alt="Item"
            style={{ maxWidth:"100%",maxHeight:"80vh",objectFit:"contain",borderRadius:"var(--rl)" }}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{ position:"absolute",top:20,right:20,background:"rgba(255,255,255,.15)",border:"none",color:"#fff",fontSize:20,width:36,height:36,borderRadius:"50%",cursor:"pointer" }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}