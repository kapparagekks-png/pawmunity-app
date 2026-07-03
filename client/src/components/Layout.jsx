import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../context.jsx";
import { api } from "../api.js";
import { Img } from "./bits.jsx";
import {
  HomeIcon,
  SearchIcon,
  CompassIcon,
  ReelsIcon,
  SendIcon,
  VetIcon,
  StoreIcon,
  BagIcon,
  PlusIcon,
  PawIcon,
  CheckIcon,
} from "../Icons.jsx";
import CreatePostModal from "./CreatePostModal.jsx";

function NavBtn({ to, icon, label, dot }) {
  return (
    <NavLink to={to} className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
      {icon}
      {dot && <span className="dot" />}
      {label}
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { user, toasts } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo logo-script">
          <PawIcon size={22} style={{ color: "#ff7a3d" }} /> Pawmunity
        </div>
        <NavBtn to="/" icon={<HomeIcon />} label="Home" />
        <NavBtn to="/search" icon={<SearchIcon />} label="Search" />
        <NavBtn to="/explore" icon={<CompassIcon />} label="Explore" />
        <NavBtn to="/reels" icon={<ReelsIcon />} label="Reels" />
        <NavBtn to="/messages" icon={<SendIcon />} label="Messages" dot />
        <div className="nav-section">SERVICES</div>
        <NavBtn to="/vets" icon={<VetIcon />} label="Meet Vet" />
        <NavBtn to="/pets" icon={<StoreIcon />} label="Buy Pet" />
        <NavBtn to="/products" icon={<BagIcon />} label="Pet Products" />
        <div className="nav-section">ACCOUNT</div>
        <NavBtn
          to={`/u/${user.username}`}
          icon={<Img src={user.avatar} className="nav-avatar" />}
          label={user.username}
        />
        <button className="nav-item create" onClick={() => setCreateOpen(true)}>
          <PlusIcon /> Create Post
        </button>
      </aside>

      <main className="main-col">{children}</main>

      <RightPanel key={location.pathname === "/" ? "home" : "other"} />

      <nav className="bottom-nav">
        <button className={location.pathname === "/" ? "active" : ""} onClick={() => navigate("/")} aria-label="Home">
          <HomeIcon size={23} />
        </button>
        <button
          className={location.pathname === "/search" ? "active" : ""}
          onClick={() => navigate("/search")}
          aria-label="Search"
        >
          <SearchIcon size={23} />
        </button>
        <button className="fab" onClick={() => setCreateOpen(true)} aria-label="Create post">
          <PlusIcon size={22} />
        </button>
        <button
          className={location.pathname === "/vets" ? "active" : ""}
          onClick={() => navigate("/vets")}
          aria-label="Vets"
        >
          <VetIcon size={23} />
        </button>
        <button onClick={() => navigate(`/u/${user.username}`)} aria-label="Profile">
          <Img src={user.avatar} />
        </button>
      </nav>

      {createOpen && <CreatePostModal onClose={() => setCreateOpen(false)} />}

      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "success" && <CheckIcon size={15} />}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function RightPanel() {
  const { toast } = useApp();
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    api("/users/suggestions")
      .then((d) => setSuggestions(d.suggestions))
      .catch(() => {});
  }, []);

  const toggleFollow = async (s) => {
    try {
      const d = await api(`/users/${s.id}/follow`, { method: "POST" });
      setSuggestions((list) =>
        list.map((x) => (x.id === s.id ? { ...x, followedByMe: d.following } : x))
      );
      if (d.following) toast(`Following ${s.username}`, "success");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <aside className="rightbar">
      <div className="suggestions-card">
        <h3>Suggestions</h3>
        {suggestions.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 12.5 }}>No suggestions right now.</div>
        )}
        {suggestions.map((s) => (
          <div className="suggestion-row" key={s.id}>
            <Img src={s.avatar} />
            <div className="who">
              <b>{s.username}</b>
              <span>{s.reason}</span>
            </div>
            <button
              className={"follow-btn" + (s.followedByMe ? " following" : "")}
              onClick={() => toggleFollow(s)}
            >
              {s.followedByMe ? "Following" : "Follow"}
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
