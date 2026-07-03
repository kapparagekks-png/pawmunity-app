import { useState } from "react";
import { api, setToken } from "../api.js";
import { useApp } from "../context.jsx";
import {
  UserIcon,
  VetIcon,
  PawIcon,
  StoreIcon,
  AtIcon,
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  CheckIcon,
} from "../Icons.jsx";

const ROLES = [
  { id: "owner", label: "Pet Owner", icon: <UserIcon size={19} />, color: "blue" },
  { id: "vet", label: "Veterinarian", icon: <VetIcon size={19} />, color: "green" },
  { id: "pet_seller", label: "Pet Seller", icon: <PawIcon size={19} />, color: "pink" },
  { id: "product_seller", label: "Product Seller", icon: <StoreIcon size={19} />, color: "purple" },
];

export default function AuthPage() {
  const { setUser } = useApp();
  const [mode, setMode] = useState("signup");
  const [role, setRole] = useState("owner");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    petName: "",
    password: "",
    identifier: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const d =
        mode === "signup"
          ? await api("/auth/signup", {
              method: "POST",
              body: {
                role,
                firstName: form.firstName,
                lastName: form.lastName,
                username: form.username,
                email: form.email,
                petName: form.petName,
                password: form.password,
              },
            })
          : await api("/auth/login", {
              method: "POST",
              body: { identifier: form.identifier, password: form.password },
            });
      setToken(d.token);
      setWelcome(`Welcome ${d.user.firstName}!`);
      setTimeout(() => setUser(d.user), 1100);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo logo-script" style={{ justifyContent: "center", display: "flex" }}>
          Pawmunity
        </div>
        <p className="tagline">Join the ultimate pet community</p>

        {mode === "signup" && (
          <div className="role-grid">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.id}
                className={"role-card" + (role === r.id ? " selected" : "")}
                onClick={() => setRole(r.id)}
              >
                <span className={`role-icon ${r.color}`}>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        )}

        <div className="form-panel">
          <div className="grad-top" />
          <form className="fields" onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}

            {mode === "signup" ? (
              <>
                <div className="two-col">
                  <div className="field">
                    <label>First Name</label>
                    <div className="input-wrap">
                      <input placeholder="John" value={form.firstName} onChange={set("firstName")} required />
                    </div>
                  </div>
                  <div className="field">
                    <label>Last Name</label>
                    <div className="input-wrap">
                      <input placeholder="Doe" value={form.lastName} onChange={set("lastName")} />
                    </div>
                  </div>
                </div>
                <div className="field">
                  <label>Username</label>
                  <div className="input-wrap iconed">
                    <span className="lead-icon"><AtIcon size={16} /></span>
                    <input placeholder="john_doe" value={form.username} onChange={set("username")} required />
                  </div>
                </div>
                <div className="field">
                  <label>Email Address</label>
                  <div className="input-wrap iconed">
                    <span className="lead-icon"><MailIcon size={16} /></span>
                    <input type="email" placeholder="john@example.com" value={form.email} onChange={set("email")} required />
                  </div>
                </div>
                <div className="field">
                  <label>Pet's Name (optional)</label>
                  <div className="input-wrap">
                    <input placeholder="Buddy" value={form.petName} onChange={set("petName")} />
                  </div>
                </div>
              </>
            ) : (
              <div className="field">
                <label>Username or Email</label>
                <div className="input-wrap iconed">
                  <span className="lead-icon"><AtIcon size={16} /></span>
                  <input placeholder="luna_the_cat" value={form.identifier} onChange={set("identifier")} required />
                </div>
              </div>
            )}

            <div className="field">
              <label>Password</label>
              <div className="input-wrap iconed">
                <span className="lead-icon"><LockIcon size={16} /></span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button className="primary-btn" disabled={busy}>
              {busy ? "One moment..." : mode === "signup" ? "Create Account" : "Sign In"}
              {!busy && <ArrowRightIcon size={17} />}
            </button>
          </form>
        </div>

        <div className="auth-switch">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("login"); setError(""); }}>Sign in</button>
            </>
          ) : (
            <>
              New to Pawmunity?{" "}
              <button onClick={() => { setMode("signup"); setError(""); }}>Create an account</button>
            </>
          )}
        </div>

        {mode === "login" && (
          <p className="demo-hint">
            Try a demo account: username <code>luna_the_cat</code> · password <code>pawmunity</code>
          </p>
        )}
      </div>

      {welcome && (
        <div className="welcome-pop">
          <div className="inner">
            <div className="check-circle">
              <CheckIcon size={26} />
            </div>
            <b>{welcome}</b>
          </div>
        </div>
      )}
    </div>
  );
}
