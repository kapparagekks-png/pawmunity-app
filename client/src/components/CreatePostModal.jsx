import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Modal } from "./bits.jsx";

const SAMPLES = [
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=900&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=900&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=900&q=80&auto=format&fit=crop",
];

export default function CreatePostModal({ onClose }) {
  const { toast } = useApp();
  const navigate = useNavigate();
  const [image, setImage] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/posts", { method: "POST", body: { image, caption } });
      toast("Post shared! 🐾", "success");
      onClose();
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Create New Post" onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        {image && (
          <div className="img-preview">
            <img src={image} alt="Preview" onError={() => {}} />
          </div>
        )}
        <div className="field">
          <label>Image URL</label>
          <div className="input-wrap">
            <input
              placeholder="https://example.com/image.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
        </div>
        <div className="field" style={{ marginTop: -6 }}>
          <label style={{ marginBottom: 4 }}>or try a sample</label>
          <div className="chip-row">
            {SAMPLES.map((s, i) => (
              <button
                type="button"
                key={s}
                className={"chip" + (image === s ? " active" : "")}
                onClick={() => setImage(s)}
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Caption</label>
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <button className="primary-btn blue" disabled={busy || !image || !caption.trim()}>
          {busy ? "Sharing..." : "Share Post"}
        </button>
      </form>
    </Modal>
  );
}
