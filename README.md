# 🐾 Pawmunity

The ultimate pet community — share pet moments, book vets, adopt pets, and shop supplies.

Built with **React + Vite** (frontend) and **Node + Express** (backend) with a JSON file database. No external database needed.

## Requirements

- [Node.js](https://nodejs.org) **22.13 or newer** (`node -v` to check) — the database uses Node's built-in SQLite

## Launch

Open a terminal in this folder and run:

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

That's it — the API (port 4000) and the web app (port 5173) start together.

## Demo accounts

Create your own account, or sign in with a seeded one:

| Username | Password |
|---|---|
| `luna_the_cat` | `pawmunity` |
| `buddy_golden` | `pawmunity` |
| `dr_dolittle` | `pawmunity` |

## Features

- **Sign up / sign in** with 4 account roles: Pet Owner, Veterinarian, Pet Seller, Product Seller
- **Home feed** — stories row, posts with likes & comments, follow suggestions
- **Search** — users and #tags, with recent-search history
- **Explore** — trending post grid
- **Reels** — vertical media cards with likes
- **Messages** — real conversations, start a chat with anyone
- **Meet Vet** — browse vets (sort by distance / rating / fee) and book appointments
- **Buy Pet** — pet market with sale & adoption listings, contact the seller in chat
- **Pet Products** — shop with cart and checkout
- **Payments** — optional [PayHere](https://www.payhere.lk) integration for checkout & vet booking fees (LKR); runs in mock mode until you add PayHere keys (see DEPLOY.md)
- **Profile** — your posts, stats, log out
- **Create Post** — share an image with a caption

## Data & reset

All data lives in a SQLite database at `server/pawmunity.db` (created and seeded on first run). Delete that file and restart to reset to fresh demo data. Set the `DATABASE_PATH` environment variable to store it elsewhere (used for cloud deploys).

## Deploying to the internet

See **[DEPLOY.md](DEPLOY.md)** — step-by-step guide for going live on Render's free tier (plus how to keep data permanently).

## Project layout

```
├── client/   React + Vite frontend (port 5173)
├── server/   Express API + JSON database (port 4000)
└── package.json   workspace root — `npm run dev` starts both
```
