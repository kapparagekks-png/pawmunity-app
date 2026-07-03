import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Img, Spinner, Modal, money } from "../components/bits.jsx";
import { SendIcon } from "../Icons.jsx";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "sale", label: "For Sale" },
  { id: "adoption", label: "Adoption" },
];

export default function PetsPage() {
  const { config } = useApp();
  const [pets, setPets] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = filter === "all" ? "" : `?type=${filter}`;
    api(`/pets${q}`)
      .then((d) => setPets(d.pets))
      .catch(() => setPets([]));
  }, [filter]);

  return (
    <div className="main-inner wide">
      <div className="market-head">
        <h1 className="page-title">Pet Market</h1>
        <div className="chip-row">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={"chip" + (filter === f.id ? " active" : "")}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!pets ? (
        <Spinner />
      ) : (
        <div className="market-grid">
          {pets.map((p) => (
            <div className="card market-card" key={p.id}>
              <div className="img-wrap">
                <Img src={p.image} alt={p.name} />
                <span className="badge dark">{p.stage}</span>
              </div>
              <div className="body">
                <div className="top-line">
                  <h4>{p.name}</h4>
                  <span className="price">{money(p.price, config.currency)}</span>
                </div>
                <span className="sub">{p.breed} • {p.age}</span>
                <span className={"badge " + (p.type === "adoption" ? "pink" : "purple")} style={{ alignSelf: "flex-start", marginTop: 4 }}>
                  {p.type === "adoption" ? "Adoption" : "For Sale"}
                </span>
                <button className="cta dark" onClick={() => setSelected(p)}>
                  Meet {p.name}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <PetModal pet={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PetModal({ pet, onClose }) {
  const { toast, config } = useApp();
  const navigate = useNavigate();

  const contactSeller = async () => {
    try {
      await api("/conversations", { method: "POST", body: { userId: pet.seller.id } });
      toast(`Chat with ${pet.seller.username} opened 💬`, "success");
      navigate("/messages");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <Modal title={pet.name} onClose={onClose}>
      <div className="img-preview">
        <Img src={pet.image} alt={pet.name} />
      </div>
      <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 14 }}>
        {pet.breed} • {pet.age} ·{" "}
        <span style={{ color: "var(--pink)" }}>{money(pet.price, config.currency)}</span>
      </p>
      <p style={{ margin: "0 0 14px", fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
        {pet.description}
      </p>
      <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "var(--muted)" }}>
        Listed by <b>{pet.seller?.username}</b>
      </p>
      <button className="primary-btn blue" onClick={contactSeller}>
        <SendIcon size={16} /> Contact {pet.type === "adoption" ? "shelter" : "seller"}
      </button>
    </Modal>
  );
}
