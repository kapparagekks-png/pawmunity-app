import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Img, Spinner, timeAgo, formatCount, captionWithTags } from "../components/bits.jsx";
import { HeartIcon, CommentIcon, SendIcon, PlusIcon } from "../Icons.jsx";

export default function HomePage() {
  const { user, toast } = useApp();
  const [stories, setStories] = useState([]);
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    api("/stories").then((d) => setStories(d.stories)).catch(() => {});
    api("/feed")
      .then((d) => setPosts(d.posts))
      .catch((e) => {
        toast(e.message, "error");
        setPosts([]);
      });
  }, []);

  if (!posts) return <div className="main-inner"><Spinner /></div>;

  return (
    <div className="main-inner">
      <div className="card stories-card">
        <button className="story" onClick={() => toast("Stories are coming soon ✨")}>
          <span className="ring plain" style={{ position: "relative" }}>
            <Img src={user.avatar} />
            <span className="add-dot"><PlusIcon size={11} /></span>
          </span>
          <span>You</span>
        </button>
        {stories.map((s) => (
          <Link className="story" key={s.id} to={`/u/${s.user.username}`}>
            <span className="ring">
              <Img src={s.user.avatar} />
            </span>
            <span>{s.user.petName || s.user.firstName}</span>
          </Link>
        ))}
      </div>

      {posts.map((p) => (
        <PostCard key={p.id} post={p} onChange={(np) => setPosts((list) => list.map((x) => (x.id === np.id ? np : x)))} />
      ))}

      {posts.length === 0 && (
        <div className="card empty-note">No posts yet — be the first to share a furry friend! 🐾</div>
      )}
    </div>
  );
}

function PostCard({ post, onChange }) {
  const { toast } = useApp();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const toggleLike = async () => {
    try {
      const d = await api(`/posts/${post.id}/like`, { method: "POST" });
      onChange(d.post);
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const openComments = async () => {
    setShowComments((v) => !v);
    if (!comments) {
      try {
        const d = await api(`/posts/${post.id}/comments`);
        setComments(d.comments);
      } catch {
        setComments([]);
      }
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const d = await api(`/posts/${post.id}/comments`, { method: "POST", body: { text: draft } });
      setComments((c) => [...(c || []), d.comment]);
      setDraft("");
      onChange({ ...post, commentCount: post.commentCount + 1 });
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="card post-card">
      <div className="post-head">
        <Link to={`/u/${post.author.username}`}>
          <Img src={post.author.avatar} />
        </Link>
        <Link to={`/u/${post.author.username}`}>
          <b>{post.author.username}</b>
        </Link>
        <span className="time">{timeAgo(post.createdAt)}</span>
      </div>

      <Img className="post-img" src={post.image} alt={post.caption} />

      <div className="post-actions">
        <button className={"icon-btn" + (post.likedByMe ? " liked" : "")} onClick={toggleLike} aria-label="Like">
          <HeartIcon size={22} filled={post.likedByMe} />
        </button>
        <button className="icon-btn" onClick={openComments} aria-label="Comments">
          <CommentIcon size={21} />
        </button>
        <button className="icon-btn" onClick={() => toast("Link copied to clipboard 🔗")} aria-label="Share">
          <SendIcon size={20} />
        </button>
      </div>

      <div className="post-body">
        <div className="post-likes">{formatCount(post.likes)} likes</div>
        <div className="post-caption">
          <b>{post.author.username}</b>
          {captionWithTags(post.caption)}
        </div>
        <button className="view-comments" onClick={openComments}>
          {post.commentCount > 0
            ? `View all ${post.commentCount} comments`
            : "Add a comment..."}
        </button>
      </div>

      {showComments && (
        <div className="comments-box">
          {(comments || []).map((c) => (
            <div className="comment-row" key={c.id}>
              <Img src={c.author.avatar} />
              <div className="bubble">
                <b>{c.author.username}</b>
                {c.text}
              </div>
            </div>
          ))}
          {comments && comments.length === 0 && (
            <div style={{ color: "var(--muted)", fontSize: 12.5, marginBottom: 10 }}>
              No comments yet — say something nice!
            </div>
          )}
          <form className="comment-input" onSubmit={sendComment}>
            <input
              placeholder="Add a comment..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button disabled={sending || !draft.trim()}>Post</button>
          </form>
        </div>
      )}
    </article>
  );
}
