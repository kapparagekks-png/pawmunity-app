import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db, uid } from "./db.js";
import { payments, buildPayment, verifyNotifySig, formatAmount } from "./payhere.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;
const app = express();

/* ---------------- middleware ---------------- */

app.set("trust proxy", 1); // Render/most PaaS sit behind one proxy
app.use(helmet({ contentSecurityPolicy: false })); // CSP off: app loads cross-origin pet images/fonts
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" })); // PayHere notify posts form data

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts — try again in a few minutes." },
});
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

/* ---------------- helpers ---------------- */

const MAX = { caption: 500, comment: 300, message: 1000, name: 40, bio: 200, url: 500, reason: 120 };

function clean(v, max) {
  return String(v ?? "").trim().slice(0, max);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 32).toString("hex");
}

const PUBLIC_FIELDS = "id, username, firstName, lastName, role, petName, avatar, bio";

const q = {
  userById: db.prepare(`SELECT * FROM users WHERE id = ?`),
  publicUserById: db.prepare(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`),
  userByLogin: db.prepare(`SELECT * FROM users WHERE username = ? OR email = ?`),
  usernameTaken: db.prepare(`SELECT 1 FROM users WHERE username = ?`),
  emailTaken: db.prepare(`SELECT 1 FROM users WHERE email = ?`),
  insertUser: db.prepare(
    `INSERT INTO users (id, username, firstName, lastName, role, petName, email, passwordHash, passwordSalt, avatar, bio, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ),
  insertSession: db.prepare(`INSERT INTO sessions (token, userId, createdAt) VALUES (?, ?, ?)`),
  sessionUser: db.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.userId WHERE s.token = ?`
  ),
  deleteSession: db.prepare(`DELETE FROM sessions WHERE token = ?`),

  feed: db.prepare(`SELECT * FROM posts ORDER BY createdAt DESC LIMIT 100`),
  postById: db.prepare(`SELECT * FROM posts WHERE id = ?`),
  insertPost: db.prepare(
    `INSERT INTO posts (id, userId, image, caption, likes, createdAt) VALUES (?, ?, ?, ?, 0, ?)`
  ),
  postsByUser: db.prepare(`SELECT * FROM posts WHERE userId = ? ORDER BY createdAt DESC`),
  explore: db.prepare(
    `SELECT p.* FROM posts p
     ORDER BY p.likes + (SELECT COUNT(*) FROM post_likes pl WHERE pl.postId = p.id) DESC LIMIT 60`
  ),
  likeCount: db.prepare(`SELECT COUNT(*) AS n FROM post_likes WHERE postId = ?`),
  likedByMe: db.prepare(`SELECT 1 FROM post_likes WHERE postId = ? AND userId = ?`),
  addLike: db.prepare(`INSERT OR IGNORE INTO post_likes (postId, userId) VALUES (?, ?)`),
  removeLike: db.prepare(`DELETE FROM post_likes WHERE postId = ? AND userId = ?`),
  commentCount: db.prepare(`SELECT COUNT(*) AS n FROM comments WHERE postId = ?`),
  commentsForPost: db.prepare(`SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC LIMIT 200`),
  insertComment: db.prepare(
    `INSERT INTO comments (id, postId, userId, text, createdAt) VALUES (?, ?, ?, ?, ?)`
  ),

  stories: db.prepare(`SELECT * FROM stories`),
  reels: db.prepare(`SELECT * FROM reels`),
  reelById: db.prepare(`SELECT * FROM reels WHERE id = ?`),
  reelLikeCount: db.prepare(`SELECT COUNT(*) AS n FROM reel_likes WHERE reelId = ?`),
  reelLikedByMe: db.prepare(`SELECT 1 FROM reel_likes WHERE reelId = ? AND userId = ?`),
  addReelLike: db.prepare(`INSERT OR IGNORE INTO reel_likes (reelId, userId) VALUES (?, ?)`),
  removeReelLike: db.prepare(`DELETE FROM reel_likes WHERE reelId = ? AND userId = ?`),

  isFollowing: db.prepare(`SELECT 1 FROM follows WHERE followerId = ? AND followingId = ?`),
  addFollow: db.prepare(`INSERT OR IGNORE INTO follows (followerId, followingId) VALUES (?, ?)`),
  removeFollow: db.prepare(`DELETE FROM follows WHERE followerId = ? AND followingId = ?`),
  followerCount: db.prepare(`SELECT COUNT(*) AS n FROM follows WHERE followingId = ?`),
  followingCount: db.prepare(`SELECT COUNT(*) AS n FROM follows WHERE followerId = ?`),
  suggestions: db.prepare(
    `SELECT ${PUBLIC_FIELDS} FROM users
     WHERE id != ? AND id NOT IN (SELECT followingId FROM follows WHERE followerId = ?)
     LIMIT 5`
  ),
  mutualReason: db.prepare(
    `SELECT u.firstName FROM follows f1
     JOIN follows f2 ON f2.followerId = ? AND f2.followingId = f1.followerId
     JOIN users u ON u.id = f1.followerId
     WHERE f1.followingId = ? LIMIT 1`
  ),
  userByUsername: db.prepare(`SELECT * FROM users WHERE username = ?`),
  searchUsers: db.prepare(
    `SELECT ${PUBLIC_FIELDS} FROM users
     WHERE username LIKE ? OR lower(firstName) LIKE ? OR lower(lastName) LIKE ? OR lower(petName) LIKE ?
     LIMIT 10`
  ),
  allCaptions: db.prepare(`SELECT caption FROM posts`),

  convBetween: db.prepare(
    `SELECT * FROM conversations WHERE (userA = ? AND userB = ?) OR (userA = ? AND userB = ?)`
  ),
  convById: db.prepare(`SELECT * FROM conversations WHERE id = ?`),
  convsForUser: db.prepare(
    `SELECT * FROM conversations WHERE userA = ? OR userB = ? ORDER BY updatedAt DESC LIMIT 50`
  ),
  insertConv: db.prepare(`INSERT INTO conversations (id, userA, userB, updatedAt) VALUES (?, ?, ?, ?)`),
  touchConv: db.prepare(`UPDATE conversations SET updatedAt = ? WHERE id = ?`),
  lastMessage: db.prepare(`SELECT * FROM messages WHERE convId = ? ORDER BY createdAt DESC LIMIT 1`),
  messagesForConv: db.prepare(`SELECT * FROM messages WHERE convId = ? ORDER BY createdAt ASC LIMIT 500`),
  insertMessage: db.prepare(
    `INSERT INTO messages (id, convId, senderId, text, createdAt) VALUES (?, ?, ?, ?, ?)`
  ),

  vets: db.prepare(`SELECT * FROM vets`),
  vetById: db.prepare(`SELECT * FROM vets WHERE id = ?`),
  insertAppt: db.prepare(
    `INSERT INTO appointments (id, userId, vetId, date, time, petName, reason, fee, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ),
  apptById: db.prepare(`SELECT * FROM appointments WHERE id = ?`),
  setApptStatus: db.prepare(`UPDATE appointments SET status = ? WHERE id = ?`),
  apptsForUser: db.prepare(
    `SELECT * FROM appointments WHERE userId = ? AND status != 'pending_payment' ORDER BY createdAt DESC LIMIT 50`
  ),
  deleteAppt: db.prepare(`DELETE FROM appointments WHERE id = ? AND userId = ?`),

  pets: db.prepare(`SELECT * FROM pets`),
  petsByType: db.prepare(`SELECT * FROM pets WHERE type = ?`),
  products: db.prepare(`SELECT * FROM products`),
  productsByCat: db.prepare(`SELECT * FROM products WHERE category = ?`),
  productById: db.prepare(`SELECT * FROM products WHERE id = ?`),
  categories: db.prepare(`SELECT DISTINCT category FROM products`),
  insertOrder: db.prepare(
    `INSERT INTO orders (id, userId, items, total, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)`
  ),
  orderById: db.prepare(`SELECT * FROM orders WHERE id = ?`),
  setOrderStatus: db.prepare(`UPDATE orders SET status = ? WHERE id = ?`),
  ordersForUser: db.prepare(
    `SELECT * FROM orders WHERE userId = ? AND status != 'pending_payment' ORDER BY createdAt DESC LIMIT 50`
  ),
};

function meUser(u) {
  const { passwordHash, passwordSalt, ...rest } = u;
  return rest;
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = token ? q.sessionUser.get(token) : null;
  if (!user) return res.status(401).json({ error: "Not signed in" });
  req.user = user;
  req.token = token;
  next();
}

function decoratePost(p, viewerId) {
  return {
    id: p.id,
    image: p.image,
    caption: p.caption,
    createdAt: p.createdAt,
    likes: p.likes + q.likeCount.get(p.id).n,
    likedByMe: !!q.likedByMe.get(p.id, viewerId),
    commentCount: q.commentCount.get(p.id).n,
    author: q.publicUserById.get(p.userId),
  };
}

function newSession(userId) {
  const token = uid("t_") + crypto.randomBytes(16).toString("hex");
  q.insertSession.run(token, userId, Date.now());
  return token;
}

/* ---------------- auth routes ---------------- */

app.post("/api/auth/signup", (req, res) => {
  const b = req.body || {};
  const firstName = clean(b.firstName, MAX.name);
  const lastName = clean(b.lastName, MAX.name);
  const username = clean(b.username, 24).toLowerCase();
  const email = clean(b.email, 100).toLowerCase();
  const petName = clean(b.petName, MAX.name) || null;
  const password = String(b.password || "");
  const role = ["owner", "vet", "pet_seller", "product_seller"].includes(b.role) ? b.role : "owner";

  if (!firstName || !username || !email || !password) {
    return res.status(400).json({ error: "First name, username, email and password are required" });
  }
  if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
    return res.status(400).json({ error: "Username must be 3-24 characters: letters, numbers, _ or ." });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }
  if (password.length < 6 || password.length > 100) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }
  if (q.usernameTaken.get(username)) {
    return res.status(409).json({ error: "Username is already taken" });
  }
  if (q.emailTaken.get(email)) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const salt = crypto.randomBytes(12).toString("hex");
  const user = {
    id: uid("u_"),
    username,
    firstName,
    lastName,
    role,
    petName,
    email,
    passwordHash: hashPassword(password, salt),
    passwordSalt: salt,
    avatar: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(username)}`,
    bio: petName ? `Proud human of ${petName} 🐾` : "New to Pawmunity 🐾",
    createdAt: Date.now(),
  };
  q.insertUser.run(
    user.id, user.username, user.firstName, user.lastName, user.role, user.petName,
    user.email, user.passwordHash, user.passwordSalt, user.avatar, user.bio, user.createdAt
  );
  const token = newSession(user.id);
  res.json({ token, user: meUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const identifier = clean(req.body?.identifier, 100).toLowerCase();
  const password = String(req.body?.password || "");
  if (!identifier || !password) {
    return res.status(400).json({ error: "Username/email and password are required" });
  }
  const user = q.userByLogin.get(identifier, identifier);
  if (!user || hashPassword(password, user.passwordSalt) !== user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = newSession(user.id);
  res.json({ token, user: meUser(user) });
});

app.post("/api/auth/logout", auth, (req, res) => {
  q.deleteSession.run(req.token);
  res.json({ ok: true });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ user: meUser(req.user) });
});

/* ---------------- feed / posts ---------------- */

app.get("/api/feed", auth, (req, res) => {
  res.json({ posts: q.feed.all().map((p) => decoratePost(p, req.user.id)) });
});

app.post("/api/posts", auth, (req, res) => {
  const image = clean(req.body?.image, MAX.url);
  const caption = clean(req.body?.caption, MAX.caption);
  if (!image || !caption) {
    return res.status(400).json({ error: "Image URL and caption are required" });
  }
  if (!/^https?:\/\//i.test(image)) {
    return res.status(400).json({ error: "Image must be an http(s) URL" });
  }
  const id = uid("p_");
  q.insertPost.run(id, req.user.id, image, caption, Date.now());
  res.json({ post: decoratePost(q.postById.get(id), req.user.id) });
});

app.post("/api/posts/:id/like", auth, (req, res) => {
  const post = q.postById.get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (q.likedByMe.get(post.id, req.user.id)) q.removeLike.run(post.id, req.user.id);
  else q.addLike.run(post.id, req.user.id);
  res.json({ post: decoratePost(post, req.user.id) });
});

app.get("/api/posts/:id/comments", auth, (req, res) => {
  const comments = q.commentsForPost.all(req.params.id).map((c) => ({
    id: c.id,
    text: c.text,
    createdAt: c.createdAt,
    author: q.publicUserById.get(c.userId),
  }));
  res.json({ comments });
});

app.post("/api/posts/:id/comments", auth, (req, res) => {
  const post = q.postById.get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  const text = clean(req.body?.text, MAX.comment);
  if (!text) return res.status(400).json({ error: "Comment cannot be empty" });
  const id = uid("c_");
  const createdAt = Date.now();
  q.insertComment.run(id, post.id, req.user.id, text, createdAt);
  res.json({
    comment: { id, text, createdAt, author: q.publicUserById.get(req.user.id) },
  });
});

/* ---------------- stories / explore / reels ---------------- */

app.get("/api/stories", auth, (req, res) => {
  const stories = q.stories.all().map((s) => ({ ...s, user: q.publicUserById.get(s.userId) }));
  res.json({ stories });
});

app.get("/api/explore", auth, (req, res) => {
  res.json({ items: q.explore.all().map((p) => decoratePost(p, req.user.id)) });
});

app.get("/api/reels", auth, (req, res) => {
  const reels = q.reels.all().map((r) => ({
    id: r.id,
    image: r.image,
    caption: r.caption,
    likes: r.likes + q.reelLikeCount.get(r.id).n,
    likedByMe: !!q.reelLikedByMe.get(r.id, req.user.id),
    comments: r.comments,
    author: q.publicUserById.get(r.userId),
  }));
  res.json({ reels });
});

app.post("/api/reels/:id/like", auth, (req, res) => {
  const reel = q.reelById.get(req.params.id);
  if (!reel) return res.status(404).json({ error: "Reel not found" });
  if (q.reelLikedByMe.get(reel.id, req.user.id)) q.removeReelLike.run(reel.id, req.user.id);
  else q.addReelLike.run(reel.id, req.user.id);
  res.json({
    likes: reel.likes + q.reelLikeCount.get(reel.id).n,
    likedByMe: !!q.reelLikedByMe.get(reel.id, req.user.id),
  });
});

/* ---------------- users / follow / search ---------------- */

app.get("/api/users/suggestions", auth, (req, res) => {
  const suggestions = q.suggestions.all(req.user.id, req.user.id).map((u) => {
    const mutual = q.mutualReason.get(req.user.id, u.id);
    return {
      ...u,
      reason: mutual ? `Followed by ${mutual.firstName.toLowerCase()}` : "Popular",
      followedByMe: false,
    };
  });
  res.json({ suggestions });
});

app.post("/api/users/:id/follow", auth, (req, res) => {
  const target = q.userById.get(req.params.id);
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.user.id) return res.status(400).json({ error: "You cannot follow yourself" });
  let following;
  if (q.isFollowing.get(req.user.id, target.id)) {
    q.removeFollow.run(req.user.id, target.id);
    following = false;
  } else {
    q.addFollow.run(req.user.id, target.id);
    following = true;
  }
  res.json({ following });
});

app.get("/api/users/:username", auth, (req, res) => {
  const user = q.userByUsername.get(String(req.params.username).toLowerCase());
  if (!user) return res.status(404).json({ error: "User not found" });
  const posts = q.postsByUser.all(user.id).map((p) => decoratePost(p, req.user.id));
  res.json({
    user: q.publicUserById.get(user.id),
    posts,
    stats: {
      posts: posts.length,
      followers: q.followerCount.get(user.id).n,
      following: q.followingCount.get(user.id).n,
    },
    followedByMe: !!q.isFollowing.get(req.user.id, user.id),
  });
});

app.get("/api/search", auth, (req, res) => {
  const raw = clean(req.query.q, 50).toLowerCase();
  if (!raw) return res.json({ users: [], tags: [] });
  const like = `%${raw.replace(/[%_]/g, "")}%`;
  const users = q.searchUsers.all(like, like, like, like);
  const tagCounts = {};
  const needle = raw.replace(/^#/, "");
  for (const { caption } of q.allCaptions.all()) {
    for (const m of caption.match(/#\w+/g) || []) {
      const tag = m.toLowerCase();
      if (tag.includes(needle)) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const tags = Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }));
  res.json({ users, tags });
});

/* ---------------- messages ---------------- */

function decorateConversation(c, viewerId) {
  const otherId = c.userA === viewerId ? c.userB : c.userA;
  const last = q.lastMessage.get(c.id);
  return {
    id: c.id,
    other: q.publicUserById.get(otherId),
    lastMessage: last
      ? { text: last.text, createdAt: last.createdAt, mine: last.senderId === viewerId }
      : null,
    updatedAt: c.updatedAt,
  };
}

app.get("/api/conversations", auth, (req, res) => {
  const conversations = q.convsForUser
    .all(req.user.id, req.user.id)
    .map((c) => decorateConversation(c, req.user.id));
  res.json({ conversations });
});

app.post("/api/conversations", auth, (req, res) => {
  const target = q.userById.get(String(req.body?.userId || ""));
  if (!target) return res.status(404).json({ error: "User not found" });
  if (target.id === req.user.id) return res.status(400).json({ error: "That's you!" });
  let conv = q.convBetween.get(req.user.id, target.id, target.id, req.user.id);
  if (!conv) {
    const id = uid("conv_");
    q.insertConv.run(id, req.user.id, target.id, Date.now());
    conv = q.convById.get(id);
  }
  res.json({ conversation: decorateConversation(conv, req.user.id) });
});

app.get("/api/conversations/:id/messages", auth, (req, res) => {
  const conv = q.convById.get(req.params.id);
  if (!conv || (conv.userA !== req.user.id && conv.userB !== req.user.id)) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  const messages = q.messagesForConv.all(conv.id).map((m) => ({
    id: m.id,
    text: m.text,
    createdAt: m.createdAt,
    mine: m.senderId === req.user.id,
  }));
  res.json({ conversation: decorateConversation(conv, req.user.id), messages });
});

app.post("/api/conversations/:id/messages", auth, (req, res) => {
  const conv = q.convById.get(req.params.id);
  if (!conv || (conv.userA !== req.user.id && conv.userB !== req.user.id)) {
    return res.status(404).json({ error: "Conversation not found" });
  }
  const text = clean(req.body?.text, MAX.message);
  if (!text) return res.status(400).json({ error: "Message cannot be empty" });
  const id = uid("m_");
  const createdAt = Date.now();
  q.insertMessage.run(id, conv.id, req.user.id, text, createdAt);
  q.touchConv.run(createdAt, conv.id);
  res.json({ message: { id, text, createdAt, mine: true } });
});

/* ---------------- vets / appointments ---------------- */

function decorateVet(v) {
  return { ...v, available: !!v.available, nextSlots: JSON.parse(v.nextSlots || "[]") };
}

app.get("/api/vets", auth, (req, res) => {
  let vets = q.vets.all().map(decorateVet);
  const sort = req.query.sort;
  if (sort === "near") vets.sort((a, b) => a.distance - b.distance);
  else if (sort === "rating") vets.sort((a, b) => b.rating - a.rating);
  else if (sort === "fee") vets.sort((a, b) => a.fee - b.fee);
  res.json({ vets });
});

app.post("/api/vets/:id/book", auth, (req, res) => {
  const vet = q.vetById.get(req.params.id);
  if (!vet) return res.status(404).json({ error: "Vet not found" });
  const date = clean(req.body?.date, 10);
  const time = clean(req.body?.time, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ error: "Date and time are required" });
  }
  const id = uid("a_");
  const status = payments.enabled ? "pending_payment" : "confirmed";
  const appt = {
    id,
    userId: req.user.id,
    vetId: vet.id,
    date,
    time,
    petName: clean(req.body?.petName, MAX.name) || req.user.petName || "My pet",
    reason: clean(req.body?.reason, MAX.reason) || "General checkup",
    fee: vet.fee,
    status,
    createdAt: Date.now(),
  };
  q.insertAppt.run(id, appt.userId, appt.vetId, date, time, appt.petName, appt.reason, vet.fee, status, appt.createdAt);
  const payment = payments.enabled
    ? buildPayment({
        entityId: id,
        amount: vet.fee,
        items: `Vet appointment — ${vet.name}`,
        user: req.user,
      })
    : null;
  res.json({ appointment: { ...appt, vet: decorateVet(vet) }, payment });
});

app.get("/api/appointments", auth, (req, res) => {
  const appointments = q.apptsForUser.all(req.user.id).map((a) => ({
    ...a,
    vet: decorateVet(q.vetById.get(a.vetId)),
  }));
  res.json({ appointments });
});

app.delete("/api/appointments/:id", auth, (req, res) => {
  const info = q.deleteAppt.run(req.params.id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: "Appointment not found" });
  res.json({ ok: true });
});

/* ---------------- pet market / products / orders ---------------- */

app.get("/api/pets", auth, (req, res) => {
  const type = req.query.type;
  const rows = type === "sale" || type === "adoption" ? q.petsByType.all(type) : q.pets.all();
  res.json({ pets: rows.map((p) => ({ ...p, seller: q.publicUserById.get(p.sellerId) })) });
});

app.get("/api/products", auth, (req, res) => {
  const cat = clean(req.query.category, 30);
  const products = cat && cat !== "All" ? q.productsByCat.all(cat) : q.products.all();
  res.json({
    products,
    categories: ["All", ...q.categories.all().map((r) => r.category)],
  });
});

app.post("/api/orders", auth, (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 50) : [];
  const detailed = [];
  let total = 0;
  for (const it of items) {
    const product = q.productById.get(String(it?.productId || ""));
    if (!product) continue;
    const qty = Math.max(1, Math.min(99, Number(it.qty) || 1));
    detailed.push({ productId: product.id, name: product.name, price: product.price, qty });
    total += product.price * qty;
  }
  if (detailed.length === 0) return res.status(400).json({ error: "Cart is empty" });
  const status = payments.enabled ? "pending_payment" : "confirmed";
  const order = {
    id: uid("o_"),
    userId: req.user.id,
    items: detailed,
    total: Math.round(total * 100) / 100,
    status,
    createdAt: Date.now(),
  };
  q.insertOrder.run(order.id, order.userId, JSON.stringify(detailed), order.total, status, order.createdAt);
  const payment = payments.enabled
    ? buildPayment({
        entityId: order.id,
        amount: order.total,
        items: detailed.map((i) => `${i.name} x${i.qty}`).join(", ").slice(0, 250),
        user: req.user,
      })
    : null;
  res.json({ order, payment });
});

app.get("/api/orders", auth, (req, res) => {
  const orders = q.ordersForUser.all(req.user.id).map((o) => ({ ...o, items: JSON.parse(o.items) }));
  res.json({ orders });
});

/* ---------------- payments (PayHere) ---------------- */

function applyPaymentStatus(entityId, newStatus) {
  if (entityId.startsWith("o_")) {
    const order = q.orderById.get(entityId);
    if (!order) return false;
    q.setOrderStatus.run(newStatus, entityId);
    return true;
  }
  if (entityId.startsWith("a_")) {
    const appt = q.apptById.get(entityId);
    if (!appt) return false;
    q.setApptStatus.run(newStatus, entityId);
    return true;
  }
  return false;
}

// Server-to-server callback from PayHere — the source of truth for payment status.
app.post("/api/payments/payhere/notify", (req, res) => {
  if (!payments.enabled) return res.status(404).end();
  const b = req.body || {};
  if (!verifyNotifySig(b)) {
    console.warn("PayHere notify: bad signature for", b.order_id);
    return res.status(400).end();
  }
  const code = String(b.status_code);
  const map = { 2: "confirmed", 0: "pending_payment", "-1": "canceled", "-2": "failed", "-3": "chargedback" };
  const status = map[code] || "failed";
  applyPaymentStatus(String(b.order_id || ""), status);
  res.status(200).end();
});

// Sandbox-only fallback: PayHere can't reach localhost with the notify
// callback, so after the SDK reports completion the client claims the payment.
// Live mode ignores this and trusts only the signed notify webhook.
app.post("/api/payments/payhere/client-confirm", auth, (req, res) => {
  if (!payments.enabled) return res.status(404).json({ error: "Payments not enabled" });
  const entityId = String(req.body?.entityId || "");
  const owned =
    (entityId.startsWith("o_") && q.orderById.get(entityId)?.userId === req.user.id) ||
    (entityId.startsWith("a_") && q.apptById.get(entityId)?.userId === req.user.id);
  if (!owned) return res.status(404).json({ error: "Not found" });
  if (!payments.sandbox) {
    // In live mode the webhook decides; report current status.
    const cur = entityId.startsWith("o_") ? q.orderById.get(entityId) : q.apptById.get(entityId);
    return res.json({ status: cur.status });
  }
  const cur = entityId.startsWith("o_") ? q.orderById.get(entityId) : q.apptById.get(entityId);
  if (cur.status === "pending_payment") applyPaymentStatus(entityId, "paid_unverified");
  const updated = entityId.startsWith("o_") ? q.orderById.get(entityId) : q.apptById.get(entityId);
  res.json({ status: updated.status });
});

/* ---------------- misc / static ---------------- */

app.get("/api/config", (req, res) => {
  res.json({
    payments: payments.enabled ? "payhere" : "mock",
    sandbox: payments.sandbox,
    currency: payments.enabled ? payments.currency : "USD",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "Pawmunity API" });
});

app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

// In production, serve the built React app
const distDir = path.join(__dirname, "../client/dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { maxAge: "1h", index: false }));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(PORT, () => {
  console.log(`🐾 Pawmunity running at http://localhost:${PORT}`);
});
