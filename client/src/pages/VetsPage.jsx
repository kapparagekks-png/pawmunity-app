import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Img, Spinner, Modal, money } from "../components/bits.jsx";
import { payWithPayHere } from "../components/payhere.js";
import { StarIcon, PinIcon, CheckIcon, CalendarIcon } from "../Icons.jsx";

const SORTS = [
  { id: "near", label: "Near Me" },
  { id: "rating", label: "Top Rated" },
  { id: "fee", label: "Lowest Fee" },
];

export default function VetsPage() {
  const { toast, config } = useApp();
  const [vets, setVets] = useState(null);
  const [sort, setSort] = useState("near");
  const [booking, setBooking] = useState(null);
  const [appointments, setAppointments] = useState([]);

  const cur = config.currency;

  useEffect(() => {
    api(`/vets?sort=${sort}`)
      .then((d) => setVets(d.vets))
      .catch(() => setVets([]));
  }, [sort]);

  const loadAppointments = () => {
    api("/appointments")
      .then((d) => setAppointments(d.appointments))
      .catch(() => {});
  };
  useEffect(loadAppointments, []);

  const cancelAppt = async (a) => {
    try {
      await api(`/appointments/${a.id}`, { method: "DELETE" });
      toast("Appointment cancelled", "success");
      loadAppointments();
    } catch (e) {
      toast(e.message, "error");
    }
  };

  return (
    <div className="main-inner">
      <div className="vet-head">
        <div>
          <h1 className="page-title">Veterinarians</h1>
          <p className="page-sub">Book appointments online</p>
        </div>
        <div className="chip-row">
          {SORTS.map((s) => (
            <button
              key={s.id}
              className={"chip" + (sort === s.id ? " active" : "")}
              onClick={() => setSort(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {appointments.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {appointments.map((a) => (
            <div className="appt-strip" key={a.id}>
              <CalendarIcon size={17} />
              <span>
                <span className="when">{a.date} · {a.time}</span> with {a.vet?.name} — {a.petName}
              </span>
              <button className="cancel" onClick={() => cancelAppt(a)}>Cancel</button>
            </div>
          ))}
        </div>
      )}

      {!vets ? (
        <Spinner />
      ) : (
        vets.map((v) => (
          <div className="card vet-card" key={v.id}>
            <span className="photo-wrap">
              <Img className="photo" src={v.photo} alt={v.name} />
              <span className={"status-dot " + (v.available ? "on" : "off")} />
            </span>
            <div className="info">
              <h4>{v.name}</h4>
              <div className="sub">{v.specialty} • {v.clinic}</div>
              <div className="stats">
                <span className="star"><StarIcon size={14} /> {v.rating}</span>
                <span className="pin"><PinIcon size={14} /> {v.distance}mi</span>
                <span style={{ color: "var(--muted)", fontWeight: 600 }}>{v.reviews} reviews</span>
              </div>
            </div>
            <div className="fee">
              {money(v.fee, cur)}
              <small>per visit</small>
            </div>
            <button className="book-btn" onClick={() => setBooking(v)}>Book</button>
          </div>
        ))
      )}

      {booking && (
        <BookingModal
          vet={booking}
          onClose={() => setBooking(null)}
          onBooked={() => {
            setBooking(null);
            loadAppointments();
          }}
        />
      )}
    </div>
  );
}

function next7Days() {
  const out = [];
  const fmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      value: d.toISOString().slice(0, 10),
      label: fmt.format(d),
    });
  }
  return out;
}

function BookingModal({ vet, onClose, onBooked }) {
  const { user, toast, config } = useApp();
  const days = next7Days();
  const [date, setDate] = useState(days[0].value);
  const [time, setTime] = useState(vet.nextSlots[0]);
  const [petName, setPetName] = useState(user.petName || "");
  const [reason, setReason] = useState("General checkup");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const cur = config.currency;

  const book = async () => {
    setBusy(true);
    try {
      const d = await api(`/vets/${vet.id}/book`, {
        method: "POST",
        body: { date, time, petName, reason },
      });
      if (d.payment) {
        try {
          await payWithPayHere(d.payment);
        } catch (e) {
          toast(e.message, e.dismissed ? "default" : "error");
          return;
        }
        await api("/payments/payhere/client-confirm", {
          method: "POST",
          body: { entityId: d.appointment.id },
        }).catch(() => {});
      }
      setDone(d.appointment);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    const dayLabel = days.find((d) => d.value === done.date)?.label || done.date;
    return (
      <Modal onClose={onBooked}>
        <div className="success-pane">
          <div className="check-circle"><CheckIcon size={28} /></div>
          <h3>Appointment confirmed!</h3>
          <p>
            {done.petName} is booked with <b>{vet.name}</b> at {vet.clinic}
            <br />
            {dayLabel} at {done.time} · {money(done.fee, cur)} {config.payments === "payhere" ? "paid" : "fee"}
          </p>
          <button className="primary-btn blue" onClick={onBooked}>Done</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={`Book ${vet.name}`} onClose={onClose}>
      <div className="field">
        <label>Pick a day</label>
        <div className="slot-grid">
          {days.slice(0, 5).map((d) => (
            <button
              key={d.value}
              type="button"
              className={"slot" + (date === d.value ? " selected" : "")}
              onClick={() => setDate(d.value)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Available times</label>
        <div className="slot-grid">
          {vet.nextSlots.map((t) => (
            <button
              key={t}
              type="button"
              className={"slot" + (time === t ? " selected" : "")}
              onClick={() => setTime(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>Pet's name</label>
        <div className="input-wrap">
          <input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Buddy" />
        </div>
      </div>
      <div className="field">
        <label>Reason</label>
        <div className="input-wrap">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="General checkup" />
        </div>
      </div>
      <button className="primary-btn" onClick={book} disabled={busy}>
        {busy
          ? "Processing..."
          : config.payments === "payhere"
          ? `Pay ${money(vet.fee, cur)} & Book`
          : `Confirm · ${money(vet.fee, cur)}`}
      </button>
      {config.payments === "payhere" && config.sandbox && (
        <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--muted)", textAlign: "center" }}>
          Sandbox mode — use PayHere test cards, no real money moves.
        </p>
      )}
    </Modal>
  );
}
