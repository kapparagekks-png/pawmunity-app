import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import { seed } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = process.env.DATABASE_PATH || path.join(__dirname, "pawmunity.db");

export const db = new DatabaseSync(DB_FILE);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT DEFAULT '',
  role TEXT DEFAULT 'owner',
  petName TEXT,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  passwordSalt TEXT NOT NULL,
  avatar TEXT,
  bio TEXT DEFAULT '',
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  caption TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS post_likes (
  postId TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (postId, userId)
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS stories (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image TEXT
);
CREATE TABLE IF NOT EXISTS reels (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image TEXT NOT NULL,
  caption TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reel_likes (
  reelId TEXT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (reelId, userId)
);
CREATE TABLE IF NOT EXISTS follows (
  followerId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followingId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (followerId, followingId)
);
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  userA TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  userB TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updatedAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  convId TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  senderId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS vets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT,
  clinic TEXT,
  fee REAL NOT NULL,
  rating REAL,
  reviews INTEGER,
  distance REAL,
  photo TEXT,
  available INTEGER DEFAULT 1,
  nextSlots TEXT DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vetId TEXT NOT NULL REFERENCES vets(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  petName TEXT,
  reason TEXT,
  fee REAL,
  status TEXT DEFAULT 'confirmed',
  createdAt INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT,
  age TEXT,
  stage TEXT,
  price REAL,
  type TEXT,
  image TEXT,
  sellerId TEXT REFERENCES users(id),
  description TEXT
);
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  price REAL,
  rating REAL,
  reviews INTEGER,
  image TEXT,
  sellerId TEXT REFERENCES users(id),
  description TEXT
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT DEFAULT 'confirmed',
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(userId);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(postId);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(convId);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
`);

// Seed demo data on first run
const userCount = db.prepare("SELECT COUNT(*) AS n FROM users").get().n;
if (userCount === 0) {
  const data = seed();
  db.exec("BEGIN");
  try {
    const insUser = db.prepare(
      `INSERT INTO users (id, username, firstName, lastName, role, petName, email, passwordHash, passwordSalt, avatar, bio, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const u of data.users)
      insUser.run(u.id, u.username, u.firstName, u.lastName, u.role, u.petName, u.email, u.passwordHash, u.passwordSalt, u.avatar, u.bio, u.createdAt);

    const insPost = db.prepare(
      "INSERT INTO posts (id, userId, image, caption, likes, createdAt) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const p of data.posts) insPost.run(p.id, p.userId, p.image, p.caption, p.likes, p.createdAt);

    const insComment = db.prepare(
      "INSERT INTO comments (id, postId, userId, text, createdAt) VALUES (?, ?, ?, ?, ?)"
    );
    for (const c of data.comments) insComment.run(c.id, c.postId, c.userId, c.text, c.createdAt);

    const insStory = db.prepare("INSERT INTO stories (id, userId, image) VALUES (?, ?, ?)");
    for (const s of data.stories) insStory.run(s.id, s.userId, s.image);

    const insReel = db.prepare(
      "INSERT INTO reels (id, userId, image, caption, likes, comments) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const r of data.reels) insReel.run(r.id, r.userId, r.image, r.caption, r.likes, r.comments);

    const insVet = db.prepare(
      `INSERT INTO vets (id, name, specialty, clinic, fee, rating, reviews, distance, photo, available, nextSlots)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const v of data.vets)
      insVet.run(v.id, v.name, v.specialty, v.clinic, v.fee, v.rating, v.reviews, v.distance, v.photo, v.available ? 1 : 0, JSON.stringify(v.nextSlots));

    const insPet = db.prepare(
      `INSERT INTO pets (id, name, breed, age, stage, price, type, image, sellerId, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const p of data.pets)
      insPet.run(p.id, p.name, p.breed, p.age, p.stage, p.price, p.type, p.image, p.sellerId, p.description);

    const insProduct = db.prepare(
      `INSERT INTO products (id, name, category, price, rating, reviews, image, sellerId, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const p of data.products)
      insProduct.run(p.id, p.name, p.category, p.price, p.rating, p.reviews, p.image, p.sellerId, p.description);

    const insFollow = db.prepare("INSERT INTO follows (followerId, followingId) VALUES (?, ?)");
    for (const f of data.follows) insFollow.run(f.followerId, f.followingId);

    const insConv = db.prepare(
      "INSERT INTO conversations (id, userA, userB, updatedAt) VALUES (?, ?, ?, ?)"
    );
    for (const c of data.conversations) insConv.run(c.id, c.memberIds[0], c.memberIds[1], c.updatedAt);

    const insMsg = db.prepare(
      "INSERT INTO messages (id, convId, senderId, text, createdAt) VALUES (?, ?, ?, ?, ?)"
    );
    for (const m of data.messages) insMsg.run(m.id, m.convId, m.senderId, m.text, m.createdAt);

    db.exec("COMMIT");
    console.log("🌱 Seeded demo data into", DB_FILE);
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}

export function uid(prefix = "") {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
