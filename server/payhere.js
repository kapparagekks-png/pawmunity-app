import crypto from "crypto";

/**
 * PayHere (payhere.lk) integration helpers.
 * Configured entirely via environment variables — when PAYHERE_MERCHANT_ID or
 * PAYHERE_MERCHANT_SECRET is missing, the app falls back to mock (instant) checkout.
 *
 *   PAYHERE_MERCHANT_ID      your merchant ID (sandbox or live)
 *   PAYHERE_MERCHANT_SECRET  merchant secret for the matching app/domain
 *   PAYHERE_SANDBOX          "true" (default) = sandbox.payhere.lk, "false" = live
 *   CURRENCY                 defaults to LKR when PayHere is enabled
 *   APP_URL                  public base URL (e.g. https://pawmunity.onrender.com)
 */

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || "";
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || "";
const SANDBOX = (process.env.PAYHERE_SANDBOX || "true").toLowerCase() !== "false";
const APP_URL = (process.env.APP_URL || "http://localhost:4000").replace(/\/$/, "");

export const payments = {
  enabled: Boolean(MERCHANT_ID && MERCHANT_SECRET),
  sandbox: SANDBOX,
  currency: process.env.CURRENCY || "LKR",
};

function md5Upper(s) {
  return crypto.createHash("md5").update(s, "utf8").digest("hex").toUpperCase();
}

export function formatAmount(n) {
  return (Math.round(Number(n) * 100) / 100).toFixed(2);
}

/** Hash sent with the checkout request. */
export function checkoutHash(orderId, amount) {
  return md5Upper(
    MERCHANT_ID + orderId + formatAmount(amount) + payments.currency + md5Upper(MERCHANT_SECRET)
  );
}

/** Verify the md5sig PayHere sends to the notify webhook. */
export function verifyNotifySig({ merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig }) {
  if (merchant_id !== MERCHANT_ID) return false;
  const expected = md5Upper(
    merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5Upper(MERCHANT_SECRET)
  );
  return expected === String(md5sig || "").toUpperCase();
}

/**
 * Build the payment object the PayHere JS SDK (payhere.startPayment) expects.
 * `entityId` doubles as PayHere's order_id; its prefix (o_/a_) tells the
 * notify webhook whether it belongs to a shop order or a vet appointment.
 */
export function buildPayment({ entityId, amount, items, user }) {
  return {
    sandbox: SANDBOX,
    merchant_id: MERCHANT_ID,
    return_url: `${APP_URL}/`,
    cancel_url: `${APP_URL}/`,
    notify_url: `${APP_URL}/api/payments/payhere/notify`,
    order_id: entityId,
    items,
    amount: formatAmount(amount),
    currency: payments.currency,
    hash: checkoutHash(entityId, amount),
    first_name: user.firstName || "Pawmunity",
    last_name: user.lastName || "Member",
    email: user.email || "member@pawmunity.app",
    // PayHere requires these fields; collect real values at checkout when you
    // start shipping physical goods.
    phone: "0770000000",
    address: "Pawmunity",
    city: "Colombo",
    country: "Sri Lanka",
  };
}
