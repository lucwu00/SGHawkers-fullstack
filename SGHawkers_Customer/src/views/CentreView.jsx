// ─── CentreView.jsx ──────────────────────────────────────────────────────────
import { useState } from "react";
import { useStalls } from "../hooks/useApi";
import { DIET_LABELS } from "../utils/constants";

const WAIT_COLORS = { busy:"#c0392b", moderate:"#e67e22", quiet:"#27ae60" };
const WAIT_LABELS = { busy:"Busy now", moderate:"Moderate", quiet:"Quiet" };

export function CentreView({ centre, onStall, onBack }) {
  const [dietFilter, setDietFilter] = useState([]);
  const { data: stalls, loading } = useStalls(centre.slug);

  function toggleDiet(k) { setDietFilter(d => d.includes(k) ? d.filter(x=>x!==k) : [...d,k]); }
  const shown = !stalls ? [] : dietFilter.length === 0 ? stalls : stalls.filter(s => dietFilter.every(d => (s.dietary_tags||[]).includes(d)));

  return (
    <div className="sec">
      <button className="back" onClick={onBack}>← All centres</button>
      <div style={{ display:"flex", alignItems:"center", gap:13, marginBottom:20 }}>
        <span style={{ fontSize:46 }}>{centre.image_emoji}</span>
        <div>
          <h2 className="stitle" style={{ marginBottom:3 }}>{centre.name}</h2>
          <div style={{ display:"flex", gap:9, alignItems:"center", flexWrap:"wrap" }}>
            <span style={{ fontSize:11, color:"var(--ink3)", textTransform:"uppercase", letterSpacing:1 }}>{centre.area}</span>
            <span style={{ display:"inline-flex", alignItems:"center", fontSize:12, color:WAIT_COLORS[centre.wait_time] }}>
              <span style={{ background:WAIT_COLORS[centre.wait_time], display:"inline-block", width:7, height:7, borderRadius:"50%", marginRight:4 }} />
              {WAIT_LABELS[centre.wait_time]}
            </span>
            {centre.eco && <span className="ecoleaf">🌿 Eco</span>}
          </div>
        </div>
      </div>
      <div className="frow">
        <span className="flabel">Filter:</span>
        {["halal","vegetarian","vegan"].map(k => (
          <button key={k} className={`chip ${dietFilter.includes(k)?"on":""}`} onClick={() => toggleDiet(k)}>{DIET_LABELS[k]}</button>
        ))}
      </div>
      {loading ? (
        <div style={{ textAlign:"center", padding:32, color:"var(--ink3)", fontStyle:"italic" }}>Loading stalls…</div>
      ) : shown.length === 0 ? (
        <div className="empty"><div className="empty-ico">🔍</div><div className="empty-title">No stalls match</div></div>
      ) : shown.map(s => (
        <div key={s.id} className="scrd" onClick={() => onStall(s)}>
          <div className="scrd-emoji">{s.image_emoji}</div>
          <div style={{ flex:1 }}>
            <div className="scrd-name">{s.name}</div>
            <div className="scrd-since">Est. {s.heritage_year} · {s.stall_type}</div>
            <div className="rrow" style={{ marginBottom:6 }}>
              <span className="rstar">★</span>
              <span style={{ fontWeight:500, fontSize:13, color:"var(--ink)" }}>{parseFloat(s.rating||0).toFixed(1)}</span>
              <span>({(s.review_count||0).toLocaleString()} reviews)</span>
            </div>
            <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
              {(s.tags||[]).map(t => <span key={t} className="tpill">{t}</span>)}
              {s.eco && <span className="tpill" style={{ color:"var(--green)", background:"#e8f5e3" }}>🌿 Eco</span>}
              {(s.dietary_tags||[]).map(d => <span key={d} className="tpill">{DIET_LABELS[d]||d}</span>)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CentreView;