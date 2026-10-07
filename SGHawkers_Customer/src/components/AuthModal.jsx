import { useState } from "react";

export default function AuthModal({ onClose, onSuccess, auth }) {
  const [tab, setTab]           = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");

  async function handleSubmit() {
    if (!email || !password) return;
    try {
      if (tab === "login") {
        await auth.login(email, password);
      } else {
        await auth.register(email, password, name, phone);
      }
      onSuccess();
    } catch { /* error shown via auth.error */ }
  }

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(26,18,8,.75)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:"var(--paper)", borderRadius:"var(--rl)", padding:30, width:"100%", maxWidth:400, borderTop:"4px solid var(--amber)" }}>

        {/* HEADER */}
        <div style={{ fontFamily:"var(--ff-d)", fontSize:20, fontWeight:700, marginBottom:6 }}>
          {tab === "login" ? "Welcome back" : "Create account"}
        </div>
        <div style={{ fontSize:13, color:"var(--ink3)", marginBottom:20, fontStyle:"italic" }}>
          {tab === "login" ? "Log in to place orders and track your history." : "Join SGHawkers — free, always."}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {["login","register"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex:1, padding:"8px", border:"none", borderRadius:"var(--r)", cursor:"pointer",
                background: tab===t ? "var(--ink)" : "var(--paper2)",
                color: tab===t ? "var(--amber2)" : "var(--ink2)",
                fontFamily:"var(--ff-s)", fontSize:13, fontWeight:500,
              }}
            >
              {t === "login" ? "Log In" : "Register"}
            </button>
          ))}
        </div>

        {/* FIELDS */}
        {tab === "register" && (
          <>
            <label style={{ fontSize:11, color:"var(--ink3)", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Name</label>
            <input
              style={{ width:"100%", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"9px 12px", fontFamily:"var(--ff-s)", fontSize:13, color:"var(--ink)", outline:"none", marginBottom:12 }}
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <label style={{ fontSize:11, color:"var(--ink3)", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Phone (optional)</label>
            <input
              style={{ width:"100%", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"9px 12px", fontFamily:"var(--ff-s)", fontSize:13, color:"var(--ink)", outline:"none", marginBottom:12 }}
              placeholder="+65 9000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </>
        )}

        <label style={{ fontSize:11, color:"var(--ink3)", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Email</label>
        <input
          type="email"
          style={{ width:"100%", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"9px 12px", fontFamily:"var(--ff-s)", fontSize:13, color:"var(--ink)", outline:"none", marginBottom:12 }}
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />

        <label style={{ fontSize:11, color:"var(--ink3)", display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>Password</label>
        <input
          type="password"
          style={{ width:"100%", background:"var(--paper2)", border:"1px solid var(--border)", borderRadius:"var(--r)", padding:"9px 12px", fontFamily:"var(--ff-s)", fontSize:13, color:"var(--ink)", outline:"none", marginBottom:16 }}
          placeholder={tab === "register" ? "At least 6 characters" : "••••••••"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />

        {/* ERROR */}
        {auth.error && (
          <div style={{ background:"#fde8e8", border:"1px solid #f5c6cb", borderRadius:"var(--r)", padding:"8px 12px", fontSize:12, color:"#721c24", marginBottom:14 }}>
            {auth.error}
          </div>
        )}

        {/* SUBMIT */}
        <button
          onClick={handleSubmit}
          disabled={auth.loading}
          style={{ width:"100%", background:"var(--ink)", color:"var(--amber2)", border:"none", padding:"12px", borderRadius:"var(--r)", fontFamily:"var(--ff-d)", fontSize:15, fontWeight:700, cursor:"pointer", opacity: auth.loading ? .6 : 1 }}
        >
          {auth.loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
        </button>

        <div style={{ textAlign:"center", marginTop:14, fontSize:12, color:"var(--ink3)", fontStyle:"italic" }}>
          {tab === "login" ? "No account? " : "Already registered? "}
          <span style={{ color:"var(--amber)", cursor:"pointer", textDecoration:"underline" }} onClick={() => setTab(tab==="login"?"register":"login")}>
            {tab === "login" ? "Register here" : "Log in"}
          </span>
        </div>
      </div>
    </div>
  );
}