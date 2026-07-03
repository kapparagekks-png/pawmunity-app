// Loads the official PayHere JS SDK on demand and wraps the popup flow in a promise.
let loading = null;

export function loadPayHere() {
  if (window.payhere) return Promise.resolve(window.payhere);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://www.payhere.lk/lib/payhere.js";
      s.onload = () => resolve(window.payhere);
      s.onerror = () => {
        loading = null;
        reject(new Error("Could not load PayHere — check your internet connection"));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** Opens the PayHere popup. Resolves when the user completes payment, rejects on dismiss/error. */
export async function payWithPayHere(payment) {
  const payhere = await loadPayHere();
  return new Promise((resolve, reject) => {
    payhere.onCompleted = (orderId) => resolve(orderId);
    payhere.onDismissed = () => {
      const e = new Error("Payment cancelled");
      e.dismissed = true;
      reject(e);
    };
    payhere.onError = (err) => reject(new Error("Payment failed: " + err));
    payhere.startPayment(payment);
  });
}
