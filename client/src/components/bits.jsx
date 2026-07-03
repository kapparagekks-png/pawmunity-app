import { useState } from "react";
import { CloseIcon } from "../Icons.jsx";

const FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fde7f0"/><text x="50" y="62" font-size="40" text-anchor="middle">🐾</text></svg>`
  );

export function Img({ src, alt = "", ...rest }) {
  const [err, setErr] = useState(false);
  return (
    <img
      src={err || !src ? FALLBACK : src}
      alt={alt}
      loading="lazy"
      onError={() => setErr(true)}
      {...rest}
    />
  );
}

export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        {title !== undefined && (
          <div className="modal-head">
            <h3>{title}</h3>
            <button onClick={onClose} aria-label="Close">
              <CloseIcon size={16} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function timeAgo(ts) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export function money(n, currency = "USD") {
  const v = Number(n) || 0;
  const s = v.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return currency === "LKR" ? `Rs. ${s}` : `$${s}`;
}

export function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

export function captionWithTags(text) {
  return text.split(/(#\w+)/g).map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="tag">
        {part}
      </span>
    ) : (
      part
    )
  );
}
