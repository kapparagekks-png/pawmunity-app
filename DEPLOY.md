# 🚀 Deploying Pawmunity to the web (Render free tier)

Two things are needed: your code on GitHub, and a Render account connected to it. ~15 minutes total.

## Step 1 — Put the code on GitHub

1. Create a free account at [github.com](https://github.com) (if you don't have one).
2. Create a new repository — name it `pawmunity`, keep it **Public** or **Private** (both work), and **don't** add a README (you already have one).
3. In a terminal, inside this folder:

```bash
git init
git add .
git commit -m "Pawmunity v1"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pawmunity.git
git push -u origin main
```

(Needs [Git](https://git-scm.com/downloads) installed. GitHub will ask you to sign in on first push.)

## Step 2 — Deploy on Render

1. Create a free account at [render.com](https://render.com) — sign up **with GitHub** to make connecting easy.
2. Click **New → Blueprint**.
3. Select your `pawmunity` repository. Render reads `render.yaml` automatically.
4. Click **Deploy Blueprint**. First build takes ~3-5 minutes.
5. Your app is live at `https://pawmunity.onrender.com` (or similar) — share that link with anyone in the world. 🌍

Pushing new commits to `main` auto-deploys updates.

## Free tier limitations (important)

- **Sleep:** after 15 minutes with no visitors the service spins down; the next visitor waits ~30-50 s while it wakes.
- **Data resets:** the free filesystem is wiped on every deploy/restart, so the SQLite database (accounts, posts, bookings) resets to demo data. Fine for showing the app off; not OK for keeping real users.

### Keeping data permanently (when you're ready)

- **Render Starter ($7/mo) + Disk (~$0.25/mo):** in your service → **Settings → Disks → Add Disk**, mount path `/data`, 1 GB. Then add an environment variable `DATABASE_PATH=/data/pawmunity.db` and redeploy. Data now survives everything.
- **Or Railway (~$5/mo):** similar setup with a volume; no sleeping.

## Payments with PayHere (optional)

Out of the box the app runs in **mock checkout** mode — orders and bookings confirm instantly with no payment. To take real (or sandbox) payments via [PayHere](https://www.payhere.lk):

1. **Sandbox first:** create a free account at [sandbox.payhere.lk](https://sandbox.payhere.lk) → Side menu → **Integrations** → copy your **Merchant ID** and generate a **Merchant Secret** for your domain.
2. **Allow your domain:** in the same Integrations screen, add your app's domain (e.g. `pawmunity.onrender.com`, or `localhost` for local testing) — the PayHere popup only opens from allowed domains.
3. **Set environment variables** — on Render: your service → **Environment** tab:

| Variable | Value |
|---|---|
| `PAYHERE_MERCHANT_ID` | your merchant ID |
| `PAYHERE_MERCHANT_SECRET` | your merchant secret |
| `PAYHERE_SANDBOX` | `true` (switch to `false` only when PayHere approves your live account) |
| `APP_URL` | your public URL, e.g. `https://pawmunity.onrender.com` |

4. Redeploy. Checkout and vet bookings now open the PayHere popup. In sandbox mode use PayHere's [test card numbers](https://support.payhere.lk/sandbox-and-testing) — no real money moves.

Locally (`npm run dev`) you can put the same variables in your shell before starting; note PayHere's server callback can't reach `localhost`, so local sandbox payments are marked `paid_unverified` instead of fully `confirmed` — on Render the callback works and orders confirm properly.

**Going live for real:** PayHere requires business verification on [www.payhere.lk](https://www.payhere.lk), and real payments make you a real merchant — refunds, disputes, and taxes included. Do that step only when Pawmunity has actual sellers and services behind it.

## Custom domain (optional)

Buy a domain (e.g. pawmunity.com) at any registrar, then in Render: **Settings → Custom Domains → Add**, and follow the DNS instructions. HTTPS is automatic.

## Before inviting lots of real users

The app already has rate limiting, security headers, hashed passwords, and input validation. For a serious launch you'd still want: email verification / password reset, real image uploads (e.g. Cloudinary), content moderation/reporting, a privacy policy + terms page, and Postgres instead of SQLite once traffic grows.
