import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { Img, Spinner, formatCount } from "../components/bits.jsx";
import { HeartIcon, CommentIcon } from "../Icons.jsx";

export default function ExplorePage() {
  const [items, setItems] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api("/explore")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  if (!items) return <div className="main-inner wide"><Spinner /></div>;

  return (
    <div className="main-inner wide">
      <div className="explore-grid">
        {items.map((p) => (
          <button key={p.id} onClick={() => navigate(`/u/${p.author.username}`)}>
            <Img src={p.image} alt={p.caption} />
            <span className="overlay">
              <span><HeartIcon size={16} filled /> {formatCount(p.likes)}</span>
              <span><CommentIcon size={16} /> {p.commentCount}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
