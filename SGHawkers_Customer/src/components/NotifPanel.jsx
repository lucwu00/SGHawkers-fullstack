import { useEffect, useRef } from "react";

export default function NotifPanel({ notifs, onClose, onMarkAll }) {
  const panelRef = useRef(null);
  const unread = notifs.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    }
    // slight delay so the opening click doesn't immediately close it
    const timer = setTimeout(() => document.addEventListener("mousedown", handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className="notif-ovl">
      <div className="notif-hdr">
        <div className="notif-htitle">
          🔔 Notifications {unread > 0 && `(${unread})`}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {unread > 0 && (
            <button
              style={{ background:"none", border:"none", color:"var(--amber)", fontSize:11, cursor:"pointer", fontFamily:"var(--ff-s)" }}
              onClick={onMarkAll}
            >
              Mark all read
            </button>
          )}
          <button
            style={{ background:"none", border:"none", color:"var(--paper3)", fontSize:16, cursor:"pointer" }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      {notifs.length === 0 ? (
        <div style={{ textAlign:"center", padding:24, fontSize:13, color:"var(--ink3)", fontStyle:"italic" }}>
          All caught up! 🎉
        </div>
      ) : (
        notifs.map((n) => (
          <div key={n.id} className={`nitem ${!n.is_read ? "unread" : ""}`}>
            <div className="nicon">{n.icon}</div>
            <div style={{ flex:1 }}>
              <div className="ntitle">{n.title}</div>
              <div className="nbody">{n.body}</div>
              <div className="ntime">{n.time}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}