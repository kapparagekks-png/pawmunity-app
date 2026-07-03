import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Img } from "../components/bits.jsx";
import { SearchIcon } from "../Icons.jsx";

const RECENT_KEY = "pawmunity_recent_searches";

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [recent, setRecent] = useState(loadRecent);
  const navigate = useNavigate();
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim()) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(() => {
      api(`/search?q=${encodeURIComponent(q.trim())}`)
        .then(setResults)
        .catch(() => setResults({ users: [], tags: [] }));
    }, 250);
    return () => clearTimeout(timer.current);
  }, [q]);

  const openUser = (u) => {
    const entry = {
      username: u.username,
      avatar: u.avatar,
      sub: u.petName ? `${u.petName} 🐾` : u.firstName,
    };
    const next = [entry, ...recent.filter((r) => r.username !== u.username)].slice(0, 6);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    navigate(`/u/${u.username}`);
  };

  const clearAll = () => {
    setRecent([]);
    localStorage.removeItem(RECENT_KEY);
  };

  return (
    <div className="main-inner">
      <div className="search-bar">
        <span className="lead"><SearchIcon size={18} /></span>
        <input
          placeholder="Search users or tags"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
        />
      </div>

      <div className="card" style={{ padding: "16px 12px", minHeight: 300 }}>
        {!results ? (
          <>
            <div className="search-section-head">
              <h3>Recent Searches</h3>
              {recent.length > 0 && <button onClick={clearAll}>Clear All</button>}
            </div>
            {recent.length === 0 && (
              <div className="empty-note">Search for pets, people, or #tags 🐶</div>
            )}
            {recent.map((r) => (
              <button className="result-row" key={r.username} onClick={() => navigate(`/u/${r.username}`)}>
                <Img src={r.avatar} />
                <div>
                  <b>{r.username}</b>
                  <span>{r.sub}</span>
                </div>
              </button>
            ))}
          </>
        ) : (
          <>
            {results.users.length === 0 && results.tags.length === 0 && (
              <div className="empty-note">No results for “{q}”</div>
            )}
            {results.users.map((u) => (
              <button className="result-row" key={u.id} onClick={() => openUser(u)}>
                <Img src={u.avatar} />
                <div>
                  <b>{u.username}</b>
                  <span>
                    {u.firstName} {u.lastName} {u.petName ? `· ${u.petName} 🐾` : ""}
                  </span>
                </div>
              </button>
            ))}
            {results.tags.map((t) => (
              <button className="result-row" key={t.tag} onClick={() => navigate("/explore")}>
                <span className="tag-circle">#</span>
                <div>
                  <b>{t.tag}</b>
                  <span>{t.count} {t.count === 1 ? "post" : "posts"}</span>
                </div>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
