import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Img, Spinner, formatCount } from "../components/bits.jsx";
import { SettingsIcon, LogoutIcon, SendIcon } from "../Icons.jsx";

const ROLE_LABELS = {
  owner: "Pet Owner",
  vet: "Veterinarian",
  pet_seller: "Pet Seller",
  product_seller: "Product Seller",
};

export default function ProfilePage() {
  const { username } = useParams();
  const { user, signOut, toast } = useApp();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  const mine = user.username === username;

  useEffect(() => {
    setData(null);
    setNotFound(false);
    api(`/users/${username}`)
      .then(setData)
      .catch(() => setNotFound(true));
  }, [username]);

  const toggleFollow = async () => {
    try {
      const d = await api(`/users/${data.user.id}/follow`, { method: "POST" });
      setData((x) => ({
        ...x,
        followedByMe: d.following,
        stats: { ...x.stats, followers: x.stats.followers + (d.following ? 1 : -1) },
      }));
    } catch (e) {
      toast(e.message, "error");
    }
  };

  const message = async () => {
    try {
      await api("/conversations", { method: "POST", body: { userId: data.user.id } });
      navigate("/messages");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  if (notFound)
    return (
      <div className="main-inner">
        <div className="card empty-note">User “{username}” was not found 🐾</div>
      </div>
    );

  if (!data) return <div className="main-inner"><Spinner /></div>;

  const u = data.user;

  return (
    <div className="main-inner wide">
      <div className="card profile-head">
        <div className="ring">
          <Img src={u.avatar} alt={u.username} />
        </div>
        <div className="info">
          <div className="top-row">
            <h2>{u.username}</h2>
            {mine ? (
              <>
                <button className="ghost-btn" onClick={signOut}>
                  <LogoutIcon size={15} /> Log Out
                </button>
                <button
                  className="icon-ghost"
                  onClick={() => toast("Settings coming soon ⚙️")}
                  aria-label="Settings"
                >
                  <SettingsIcon size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  className={"follow-btn" + (data.followedByMe ? " following" : "")}
                  style={{ padding: "8px 18px" }}
                  onClick={toggleFollow}
                >
                  {data.followedByMe ? "Following" : "Follow"}
                </button>
                <button className="ghost-btn" onClick={message}>
                  <SendIcon size={14} /> Message
                </button>
              </>
            )}
          </div>
          <div className="real-name">
            {u.firstName} {u.lastName}
          </div>
          <div className="role-tag">{ROLE_LABELS[u.role] || "Member"} account</div>
          {u.bio && <p className="bio">{u.bio}</p>}
          <div className="profile-stats">
            <div><b>{data.stats.posts}</b> <span>posts</span></div>
            <div><b>{formatCount(data.stats.followers)}</b> <span>followers</span></div>
            <div><b>{formatCount(data.stats.following)}</b> <span>following</span></div>
          </div>
        </div>
      </div>

      {data.posts.length === 0 ? (
        <div className="card empty-note">
          {mine ? "Share your first post with the Create Post button!" : "No posts yet."}
        </div>
      ) : (
        <div className="profile-grid">
          {data.posts.map((p) => (
            <Img key={p.id} src={p.image} alt={p.caption} title={p.caption} />
          ))}
        </div>
      )}
    </div>
  );
}
