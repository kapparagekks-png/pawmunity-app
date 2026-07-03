import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Img, Spinner, timeAgo, Modal } from "../components/bits.jsx";
import { ComposeIcon, SendIcon, BackIcon } from "../Icons.jsx";

export default function MessagesPage() {
  const { toast } = useApp();
  const [convs, setConvs] = useState(null);
  const [active, setActive] = useState(null); // conversation object
  const [composeOpen, setComposeOpen] = useState(false);

  const loadConvs = () => {
    api("/conversations")
      .then((d) => setConvs(d.conversations))
      .catch(() => setConvs([]));
  };

  useEffect(loadConvs, []);

  const startConversation = async (user) => {
    try {
      const d = await api("/conversations", { method: "POST", body: { userId: user.id } });
      setComposeOpen(false);
      setActive(d.conversation);
    } catch (e) {
      toast(e.message, "error");
    }
  };

  if (!convs) return <div className="main-inner"><Spinner /></div>;

  if (active) {
    return (
      <div className="main-inner">
        <Thread
          conv={active}
          onBack={() => {
            setActive(null);
            loadConvs();
          }}
        />
      </div>
    );
  }

  return (
    <div className="main-inner">
      <div className="card messages-card">
        <div className="messages-head">
          <h2>Messages</h2>
          <button onClick={() => setComposeOpen(true)} aria-label="New message">
            <ComposeIcon size={21} />
          </button>
        </div>
        <div style={{ padding: "6px 0 10px" }}>
          {convs.length === 0 && (
            <div className="empty-note">No conversations yet. Start one with the ✏️ button!</div>
          )}
          {convs.map((c) => (
            <button className="conv-row" key={c.id} onClick={() => setActive(c)}>
              <span className="avatar-wrap">
                <Img src={c.other.avatar} />
                {Date.now() - c.updatedAt < 5 * 60 * 1000 && <span className="online" />}
              </span>
              <span className="meta">
                <b>{c.other.petName || c.other.firstName}</b>
                <span className={c.lastMessage && !c.lastMessage.mine && Date.now() - c.lastMessage.createdAt < 3600e3 ? "unread" : ""}>
                  {c.lastMessage
                    ? `${c.lastMessage.mine ? "You: " : ""}${c.lastMessage.text} · ${timeAgo(c.lastMessage.createdAt)}`
                    : "Say hi 👋"}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {composeOpen && (
        <ComposeModal onClose={() => setComposeOpen(false)} onPick={startConversation} />
      )}
    </div>
  );
}

function ComposeModal({ onClose, onPick }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      api(`/search?q=${encodeURIComponent(q || "a")}`)
        .then((d) => setUsers(d.users))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Modal title="New Message" onClose={onClose}>
      <div className="field">
        <div className="input-wrap">
          <input placeholder="Search people..." value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
        </div>
      </div>
      <div style={{ maxHeight: 280, overflowY: "auto" }}>
        {users.map((u) => (
          <button className="result-row" key={u.id} onClick={() => onPick(u)}>
            <Img src={u.avatar} />
            <div>
              <b>{u.username}</b>
              <span>{u.firstName} {u.lastName}</span>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function Thread({ conv, onBack }) {
  const { toast } = useApp();
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    api(`/conversations/${conv.id}/messages`)
      .then((d) => setMessages(d.messages))
      .catch(() => setMessages([]));
  }, [conv.id]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      const d = await api(`/conversations/${conv.id}/messages`, {
        method: "POST",
        body: { text: draft },
      });
      setMessages((m) => [...(m || []), d.message]);
      setDraft("");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card messages-card">
      <div className="thread-head">
        <button className="back" onClick={onBack} aria-label="Back">
          <BackIcon size={20} />
        </button>
        <Img src={conv.other.avatar} />
        <div>
          <b>{conv.other.petName || conv.other.firstName}</b>
          <span>@{conv.other.username}</span>
        </div>
      </div>

      <div className="thread-body" ref={bodyRef}>
        {!messages && <Spinner />}
        {messages && messages.length === 0 && (
          <div className="empty-note">No messages yet — break the ice! 🧊</div>
        )}
        {(messages || []).map((m) => (
          <div className={"msg-bubble" + (m.mine ? " mine" : "")} key={m.id}>
            {m.text}
            <div className="msg-time">{timeAgo(m.createdAt)}</div>
          </div>
        ))}
      </div>

      <form className="thread-input" onSubmit={send}>
        <input
          placeholder="Type a message..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button disabled={sending || !draft.trim()} aria-label="Send">
          <SendIcon size={18} />
        </button>
      </form>
    </div>
  );
}
