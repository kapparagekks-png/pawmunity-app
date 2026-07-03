import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Img, Spinner, Modal, money } from "../components/bits.jsx";
import { payWithPayHere } from "../components/payhere.js";
import { StarIcon, CartIcon, CloseIcon, CheckIcon, BagIcon } from "../Icons.jsx";

export default function ProductsPage() {
  const { toast, cart, addToCart, setQty, setCart, config } = useApp();
  const [data, setData] = useState(null);
  const [category, setCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [orderDone, setOrderDone] = useState(null);

  const cur = config.currency;

  useEffect(() => {
    api(`/products?category=${encodeURIComponent(category)}`)
      .then(setData)
      .catch(() => setData({ products: [], categories: ["All"] }));
  }, [category]);

  const cartCount = cart.reduce((n, i) => n + i.qty, 0);
  const cartTotal = cart.reduce((n, i) => n + i.qty * i.price, 0);

  const checkout = async () => {
    setPaying(true);
    try {
      const d = await api("/orders", {
        method: "POST",
        body: { items: cart.map(({ productId, qty }) => ({ productId, qty })) },
      });
      if (d.payment) {
        // Real checkout via PayHere popup
        setCartOpen(false);
        try {
          await payWithPayHere(d.payment);
        } catch (e) {
          toast(e.message, e.dismissed ? "default" : "error");
          if (e.dismissed) setCartOpen(true);
          return;
        }
        await api("/payments/payhere/client-confirm", {
          method: "POST",
          body: { entityId: d.order.id },
        }).catch(() => {});
        setCart([]);
        setOrderDone(d.order);
      } else {
        // Demo mode — instant confirmation
        setCart([]);
        setCartOpen(false);
        setOrderDone(d.order);
      }
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="main-inner wide">
      <div className="market-head">
        <h1 className="page-title">Pet Products</h1>
        <span className="badge purple">Supplies</span>
      </div>

      {data && (
        <div className="chip-row" style={{ marginBottom: 16 }}>
          {data.categories.map((c) => (
            <button
              key={c}
              className={"chip" + (category === c ? " active" : "")}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {!data ? (
        <Spinner />
      ) : (
        <div className="market-grid">
          {data.products.map((p) => (
            <div className="card market-card" key={p.id}>
              <div className="img-wrap">
                <Img src={p.image} alt={p.name} />
                <span className="badge purple">{p.category}</span>
              </div>
              <div className="body">
                <div className="top-line">
                  <h4>{p.name}</h4>
                  <span className="price">{money(p.price, cur)}</span>
                </div>
                <span className="rating">
                  <StarIcon size={13} /> {p.rating} · {p.reviews} reviews
                </span>
                <span className="sub">{p.description}</span>
                <button
                  className="cta"
                  onClick={() => {
                    addToCart(p);
                    toast(`${p.name} added to cart 🛒`, "success");
                  }}
                >
                  <CartIcon size={15} /> Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {cartCount > 0 && (
        <button className="cart-fab" onClick={() => setCartOpen(true)}>
          <CartIcon size={18} />
          Cart <span className="count">{cartCount}</span> · {money(cartTotal, cur)}
        </button>
      )}

      {cartOpen && (
        <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && setCartOpen(false)}>
          <div className="cart-drawer">
            <div className="head">
              <h3>Your Cart</h3>
              <button onClick={() => setCartOpen(false)} aria-label="Close">
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="items">
              {cart.length === 0 && <div className="empty-note">Cart is empty</div>}
              {cart.map((i) => (
                <div className="cart-item" key={i.productId}>
                  <Img src={i.image} alt={i.name} />
                  <div className="mid">
                    <b>{i.name}</b>
                    <span>{money(i.price, cur)}</span>
                  </div>
                  <div className="qty-ctrl">
                    <button onClick={() => setQty(i.productId, i.qty - 1)}>−</button>
                    <span>{i.qty}</span>
                    <button onClick={() => setQty(i.productId, i.qty + 1)}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="foot">
              <div className="cart-total">
                <span>Total</span>
                <span>{money(cartTotal, cur)}</span>
              </div>
              <button className="primary-btn" onClick={checkout} disabled={cart.length === 0 || paying}>
                {paying
                  ? "Processing..."
                  : config.payments === "payhere"
                  ? `Pay ${money(cartTotal, cur)} with PayHere`
                  : "Place Order"}
              </button>
              {config.payments === "payhere" && config.sandbox && (
                <p style={{ margin: "10px 0 0", fontSize: 11.5, color: "var(--muted)", textAlign: "center" }}>
                  Sandbox mode — use PayHere test cards, no real money moves.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {orderDone && (
        <Modal onClose={() => setOrderDone(null)}>
          <div className="success-pane">
            <div className="check-circle"><CheckIcon size={28} /></div>
            <h3>Order confirmed! 🎉</h3>
            <p>
              Order <b>#{orderDone.id.slice(-6).toUpperCase()}</b> · {money(orderDone.total, cur)}
              <br />
              {orderDone.items.reduce((n, i) => n + i.qty, 0)} item(s) on the way to your den.
            </p>
            <button className="primary-btn blue" onClick={() => setOrderDone(null)}>
              <BagIcon size={16} /> Keep Shopping
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
