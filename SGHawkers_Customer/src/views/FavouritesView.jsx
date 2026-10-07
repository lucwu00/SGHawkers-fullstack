// ─── FavouritesView.jsx ───────────────────────────────────────────────────────
import { useEffect, useState } from "react";
import { api } from "../api/client";

export function FavouritesView({ favsHook, isLoggedIn, onLogin, onGoToStall }) {
  const [favStalls, setFavStalls] = useState([]);
  const [favItems,  setFavItems]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    Promise.all([
      api.get("/favourites/stalls"),
      api.get("/favourites/items"),
    ]).then(([stalls, items]) => {
      setFavStalls(stalls);
      setFavItems(items);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="sec">
        <div className="empty">
          <div className="empty-ico">⭐</div>
          <div className="empty-title">Log in to see your favourites</div>
          <button className="hero-cta" style={{ marginTop:14 }} onClick={onLogin}>Log In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sec">
      <div className="stitle">Your Favourites</div>
      <div className="ssub">Stalls and dishes you've starred</div>
      <div className="dvdr" />
      {loading ? (
        <div style={{ color:"var(--ink3)", fontStyle:"italic" }}>Loading…</div>
      ) : favStalls.length === 0 && favItems.length === 0 ? (
        <div className="empty">
          <div className="empty-ico">⭐</div>
          <div className="empty-title">No favourites yet</div>
          <p style={{ fontStyle:"italic" }}>Star a stall or dish while browsing.</p>
        </div>
      ) : (
        <>
          {favStalls.length > 0 && (
            <>
              <div style={{ fontFamily:"var(--ff-d)", fontSize:14, fontWeight:700, marginBottom:9, color:"var(--ink2)" }}>⭐ Saved Stalls</div>
              {favStalls.map(s => (
                <div key={s.id} className="scrd" style={{ cursor:"pointer" }} 
                  onClick={() => onGoToStall(s, {id:s.centre_id, slug:s.centre_slug, name:s.centre_name})}>
                  <div className="scrd-emoji">{s.image_emoji}</div>
                  <div>
                    <div className="scrd-name">{s.name}</div>
                    <div className="scrd-since">Est. {s.heritage_year}</div>
                    <div className="rrow"><span className="rstar">★</span>{parseFloat(s.rating||0).toFixed(1)}</div>
                  </div>
                </div>
              ))}
            </>
          )}
          {favItems.length > 0 && (
            <>
              <div style={{ fontFamily:"var(--ff-d)", fontSize:14, fontWeight:700, margin:"15px 0 9px", color:"var(--ink2)" }}>♥ Saved Dishes</div>
              {favItems.map(m => (
                <div key={m.id} className="mitem">
                  <div className="minfo">
                    <div className="mname">{m.name}</div>
                    <div className="mdesc">{m.stall_name} · {m.description}</div>
                    <div className="mprice">${parseFloat(m.price).toFixed(2)}</div>
                  </div>
                  <span style={{ fontSize:18, color:"#c0392b" }}>♥</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default FavouritesView;