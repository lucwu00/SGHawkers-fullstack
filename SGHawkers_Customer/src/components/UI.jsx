// ─── SHARED UI COMPONENTS ────────────────────────────────────────────────────

const WAIT_COLORS = { busy: "#c0392b", moderate: "#e67e22", quiet: "#27ae60" };
const WAIT_LABELS = { busy: "Busy now", moderate: "Moderate", quiet: "Quiet" };

export function WaitBadge({ level }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", fontSize: 12, color: WAIT_COLORS[level] }}>
      <span
        className="wdot"
        style={{ background: WAIT_COLORS[level], display: "inline-block", width: 7, height: 7, borderRadius: "50%", marginRight: 4 }}
      />
      {WAIT_LABELS[level]}
    </span>
  );
}

export function Stars({ n }) {
  return <span className="stars">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>;
}

export function Toast({ msg }) {
  return <div className={`toast ${msg ? "show" : ""}`}>{msg}</div>;
}

export function RatingRow({ rating, reviews, children }) {
  return (
    <div className="rrow">
      <span className="rstar">★</span>
      <span style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)" }}>{rating}</span>
      {reviews && <span>({reviews.toLocaleString()} reviews)</span>}
      {children}
    </div>
  );
}