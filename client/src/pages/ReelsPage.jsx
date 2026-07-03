import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Img, Spinner, formatCount, captionWithTags } from "../components/bits.jsx";
import { HeartIcon, CommentIcon, SendIcon } from "../Icons.jsx";

export default function ReelsPage() {
  const { toast } = useApp();
  const [reels, setReels] = useState(null);

  useEffect(() => {
    api("/reels")
      .then((d) => setReels(d.reels))
      .catch(() => setReels([]));
  }, []);

  const toggleLike = async (r) => {
    try {
      const d = await api(`/reels/${r.id}/like`, { method: "POST" });
      setReels((list) =>
        list.map((x) => (x.id === r.id ? { ...x, likes: d.likes, likedByMe: d.likedByMe } : x))
      );
    } catch (e) {
      toast(e.message, "error");
    }
  };

  if (!reels) return <div className="main-inner"><Spinner /></div>;

  return (
    <div className="main-inner">
      {reels.map((r) => (
        <div className="reel-card" key={r.id}>
          <Img className="media" src={r.image} alt={r.caption} />
          <div className="reel-grad" />
          <div className="reel-info">
            <Link className="who" to={`/u/${r.author.username}`}>
              <Img src={r.author.avatar} />
              <b>{r.author.username}</b>
            </Link>
            <p>{captionWithTags(r.caption)}</p>
          </div>
          <div className="reel-rail">
            <button className={r.likedByMe ? "liked" : ""} onClick={() => toggleLike(r)}>
              <HeartIcon size={27} filled={r.likedByMe} />
              {formatCount(r.likes)}
            </button>
            <button onClick={() => toast("Comments coming soon 💬")}>
              <CommentIcon size={25} />
              {formatCount(r.comments)}
            </button>
            <button onClick={() => toast("Link copied to clipboard 🔗")}>
              <SendIcon size={24} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
