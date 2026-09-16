import { useEffect, useState } from 'react';

const api = async (path, options = {}) => {
  const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/api${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || body.message || 'Request failed');
  }
  return response.status === 204 ? null : response.json();
};

function CustomerSite() {
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [toast, setToast] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderQuantities, setOrderQuantities] = useState({});
  const [orderType, setOrderType] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState(null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const [nextMenu, nextCategories] = await Promise.all([api('/menu'), api('/categories')]);
        setMenu(nextMenu);
        setCategories(nextCategories);
        setCategory((current) => nextCategories.includes(current) ? current : nextCategories[0] || '');
      } catch { setToast('Menu is temporarily unavailable.'); }
    };
    loadMenu();
    const interval = window.setInterval(loadMenu, 4000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const bookingId = localStorage.getItem('sorellaLastBookingId');
    if (!bookingId) return undefined;
    const loadStatus = async () => {
      try {
        setStatus(await api(`/bookings/${encodeURIComponent(bookingId)}`));
      } catch {
        // The customer page remains usable while the API is unavailable.
      }
    };
    loadStatus();
    const interval = window.setInterval(loadStatus, 4000);
    return () => window.clearInterval(interval);
  }, []);

  async function submitReservation(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      const booking = await api('/bookings', { method: 'POST', body: JSON.stringify(data) });
      localStorage.setItem('sorellaLastBookingId', booking.id);
      setStatus(booking);
      setModalOpen(false);
      form.reset();
      setToast('Your table request is in. See you soon!');
      window.setTimeout(() => setToast(''), 4000);
    } catch {
      setToast('We could not send that request. Please try again.');
    }
  }

  async function submitOrder(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const items = menu.filter((dish) => Number(orderQuantities[dish.id]) > 0).map((dish) => ({ id: dish.id, quantity: Number(orderQuantities[dish.id]) }));
    if (!items.length) {
      setToast('Choose at least one dish for your order.');
      return;
    }
    try {
      const order = await api('/orders', { method: 'POST', body: JSON.stringify({ ...data, items }) });
      setOrderQuantities({});
      setOrderType('');
      setSubmittedOrder(order);
      form.reset();
      setToast('Your order has been sent to Sorella.');
      window.setTimeout(() => setToast(''), 4000);
    } catch (error) {
      setToast(error.message);
    }
  }

  return <>
    <div className="announcement">Kitchen open until 11pm tonight <span>•</span> Walk-ins welcome at the bar</div>
    <header className="site-header" id="top">
      <a className="brand" href="#top" aria-label="Sorella home"><span className="brand-mark">S</span><span className="brand-copy"><strong>Sorella</strong><small>Italian kitchen</small></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="#menu">Menu</a><a href="#order">Order</a><a href="#story">Our story</a><a href="#visit">Visit us</a></nav>
      <button className="button button-dark header-cta" onClick={() => setModalOpen(true)}>Book a table <span>↗</span></button>
      <button className="menu-toggle" aria-label="Open menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><span></span><span></span></button>
    </header>
    <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}><a href="#menu" onClick={() => setMobileOpen(false)}>Menu</a><a href="#order" onClick={() => setMobileOpen(false)}>Order</a><a href="#story" onClick={() => setMobileOpen(false)}>Our story</a><a href="#visit" onClick={() => setMobileOpen(false)}>Visit us</a><button className="button button-dark" onClick={() => { setMobileOpen(false); setModalOpen(true); }}>Book a table <span>↗</span></button></div>

    <main>
      <section className="hero section-pad"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"></span> Little Italy, big heart</p><h1>Come for the<br /><em>pasta.</em> Stay for<br />the stories.</h1><p className="hero-intro">A neighborhood kitchen with a soft spot for handmade pasta, long lunches, and the people who make a table feel like home.</p><div className="hero-actions"><button className="button button-primary" onClick={() => setModalOpen(true)}>Reserve your table <span>↗</span></button><a className="text-link" href="#menu">Explore the menu <span>↓</span></a></div><div className="hero-note"><span className="note-dot"></span><span>Now serving our spring menu</span><span className="note-rule"></span><span>Est. 2018</span></div></div><div className="hero-visual"><div className="hero-image-wrap"><img src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1300&q=88" alt="Fresh pasta being served on a ceramic plate" /></div><div className="image-caption"><span>01</span><span>made by hand,<br />served with heart</span></div><div className="hero-stamp"><span>Buon<br />appetito</span><span className="stamp-star">✦</span></div></div></section>
      <section className="marquee" aria-label="Restaurant highlights"><div className="marquee-track"><span>HANDMADE DAILY</span><i>✦</i><span>SEASONAL INGREDIENTS</span><i>✦</i><span>GOOD WINE</span><i>✦</i><span>LONG LUNCHES</span></div></section>
      <section className="story section-pad" id="story"><div className="section-label"><span>02</span><span>What we believe</span></div><div className="story-grid"><div className="story-heading"><h2>Simple food.<br /><em>Big feeling.</em></h2><span className="scribble">~</span></div><div className="story-copy"><p className="large-copy">We cook the kind of food that makes you loosen your belt and stay a little longer.</p><p>At Sorella, everything starts with the best ingredients we can find and the recipes we grew up with. Nothing fussy. Just generous plates, good wine, and a room full of people you want to be around.</p><a className="text-link" href="#visit">Meet us properly <span>↗</span></a></div></div></section>
      <section className="menu-section section-pad" id="menu"><div className="menu-heading"><div className="section-label"><span>03</span><span>From the kitchen</span></div><div><h2>Tonight's<br /><em>favorites.</em></h2><p>Built around the market, finished with a little magic.</p></div></div><div className="menu-tabs" role="tablist">{categories.map((item) => <button className={`tab ${category === item ? 'active' : ''}`} key={item} onClick={() => setCategory(item)}>{item.replaceAll('-', ' ')}</button>)}</div><div className="menu-list">{menu.filter((dish) => dish.category === category).map((dish) => <article className="menu-item" key={dish.id}><div><h3>{dish.name}</h3><p>{dish.description}</p></div><span className="menu-item-price">{dish.price}</span></article>)}</div></section>
      <section className="order-section section-pad" id="order"><div className="order-heading"><div className="section-label"><span>04</span><span>Order from the kitchen</span></div><div><h2>Good food,<br /><em>your way.</em></h2><p>Choose your dishes and tell us how you want to enjoy them.</p></div></div><form className="order-form" onSubmit={submitOrder}><div className="order-items">{menu.map((dish) => <label className="order-item" key={dish.id}><span><strong>{dish.name}</strong><small>{dish.price} · {dish.description}</small></span><input type="number" min="0" max="20" value={orderQuantities[dish.id] || ''} onChange={(event) => setOrderQuantities({ ...orderQuantities, [dish.id]: event.target.value })} placeholder="0" aria-label={`Quantity of ${dish.name}`} /></label>)}</div><div className="order-details"><label>Name<input name="customerName" placeholder="Your name" required /></label><label>Email <span className="optional">optional</span><input type="email" name="email" placeholder="you@example.com" /></label><label>Phone <span className="optional">optional</span><input name="phone" placeholder="Your phone number" /></label><label>How would you like it?<select name="orderType" value={orderType} onChange={(event) => setOrderType(event.target.value)} required><option value="">Choose one</option><option>Takeaway</option><option>Dine in</option><option>Online</option></select></label>{orderType === 'Dine in' && <><label>Guests<select name="guests" required><option value="">Choose party size</option><option>1 guest</option><option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option></select></label><label>Date<input type="date" name="date" required /></label><label>Time<select name="time" required><option value="">Choose time</option><option>6:00 pm</option><option>6:30 pm</option><option>7:00 pm</option><option>7:30 pm</option><option>8:00 pm</option><option>8:30 pm</option></select></label></>}<button className="button button-primary" type="submit">Send order <span>↗</span></button></div></form>{submittedOrder && <div className="order-success"><strong>Order {submittedOrder.status === 'Awaiting reservation' ? 'waiting for reservation approval' : 'received'}.</strong><span>Total {submittedOrder.total}</span>{submittedOrder.orderType === 'Dine in' && <a className="text-link" href={`/bill/${submittedOrder.id}`}>Open your bill <span>↗</span></a>}</div>}</section>
      <section className="reservation-banner section-pad" id="visit"><div className="reservation-inner"><div><p className="eyebrow light"><span className="eyebrow-line"></span> Your table is waiting</p><h2>Make a night<br /><em>of it.</em></h2></div><div className="reservation-side"><p>Come as you are. Bring someone you love. We'll take care of the rest.</p><button className="button button-light" onClick={() => setModalOpen(true)}>Book a table <span>↗</span></button></div></div></section>
    </main>
    <footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark">S</span><span className="brand-copy"><strong>Sorella</strong><small>Italian kitchen</small></span></a><p>Come hungry, leave happy.</p><div className="footer-links"><a href="#menu">Instagram</a><a href="#visit">Contact</a><a href="#top">Back to top ↑</a></div></footer>

    {modalOpen && <div className="modal-backdrop open" onClick={(event) => event.target === event.currentTarget && setModalOpen(false)}><div className="reservation-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-title"><button className="modal-close" aria-label="Close reservation dialog" onClick={() => setModalOpen(false)}>×</button><p className="eyebrow"><span className="eyebrow-line"></span> A table for you</p><h2 id="reservation-title">Let's make<br /><em>plans.</em></h2><form onSubmit={submitReservation}><div className="form-row"><label>Name<input type="text" name="name" placeholder="Your name" required /></label><label>Guests<select name="guests"><option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option></select></label></div><div className="form-row"><label>Date<input type="date" name="date" required /></label><label>Time<select name="time"><option>6:00 pm</option><option>6:30 pm</option><option>7:00 pm</option><option>7:30 pm</option><option>8:00 pm</option><option>8:30 pm</option></select></label></div><div className="form-row"><label>Email <span className="optional">optional</span><input type="email" name="email" placeholder="you@example.com" /></label><label>Phone <span className="optional">optional</span><input type="tel" name="phone" placeholder="Your phone number" /></label></div><button className="button button-primary form-submit" type="submit">Send request <span>↗</span></button><p className="form-note">The owner will confirm your request.</p></form></div></div>}
    {status && <aside className={`reservation-status ${status.status.toLowerCase()}`}><div><span className="status-kicker">Latest reservation</span><strong>{status.status}</strong><p>{status.status === 'Pending' ? 'Your request is pending confirmation from Sorella.' : status.status === 'Confirmed' ? 'Your reservation is confirmed. We look forward to seeing you.' : 'This request was not accepted. Please choose another time or contact us.'}</p></div></aside>}
    {toast && <div className="toast show" role="status">{toast}</div>}
  </>;
}

function BillPage() {
  const orderId = window.location.pathname.split('/').filter(Boolean).pop();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      try { setOrder(await api(`/orders/${orderId}`)); setError(''); } catch (requestError) { setError(requestError.message); }
    };
    loadOrder();
    const interval = window.setInterval(loadOrder, 4000);
    return () => window.clearInterval(interval);
  }, [orderId]);

  return <main className="bill-page"><a className="brand" href="/"><span className="brand-mark">S</span><span className="brand-copy"><strong>Sorella</strong><small>Italian kitchen</small></span></a><section className="bill-card"><p className="eyebrow"><span className="eyebrow-line"></span> Your dining bill</p><h1>{order ? `Table for ${order.customerName}` : 'Your bill'}</h1>{error && <p className="manager-message">{error}</p>}{order && <><p className="bill-status">{order.status === 'Awaiting reservation' ? 'Waiting for the owner to approve your table.' : `Order status: ${order.status}`}</p><div className="bill-items">{order.items.map((item) => <div className="bill-item" key={item.id}><span>{item.quantity} × {item.name}</span><strong>${(Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</strong></div>)}</div><div className="bill-total"><span>Total</span><strong>{order.total}</strong></div><p className="bill-note">This bill updates automatically when the restaurant adds items.</p></>}</section></main>;
}

function OwnerLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      onLogin();
    } catch (error) {
      setMessage(error.message);
    }
  }

  return <main className="bill-page"><section className="bill-card"><p className="eyebrow"><span className="eyebrow-line"></span> Owner access</p><h1>Welcome<br /><em>back.</em></h1><form className="owner-login-form" onSubmit={submit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="username" /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></label><button className="button button-primary" type="submit">Sign in <span>↗</span></button></form>{message && <p className="manager-message">{message}</p>}</section></main>;
}

function OwnerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState('');
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    api('/auth/me').then(() => setAuthenticated(true)).catch(() => setAuthenticated(false));
  }, []);

  async function loadBookings() {
    try { setBookings(await api('/bookings')); } catch { setToast('API unavailable. Start the Node server first.'); }
  }
  useEffect(() => {
    if (!authenticated) return undefined;
    loadBookings();
    const interval = window.setInterval(loadBookings, 4000);
    return () => window.clearInterval(interval);
  }, [authenticated]);

  async function changeStatus(id, status) {
    await api(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await loadBookings();
    setToast(`Booking ${status.toLowerCase()}`);
    window.setTimeout(() => setToast(''), 2500);
  }
  async function removeBooking(id) { await api(`/bookings/${id}`, { method: 'DELETE' }); await loadBookings(); }

  if (authenticated === null) return <main className="bill-page"><p className="manager-message">Checking owner access...</p></main>;
  if (!authenticated) return <OwnerLogin onLogin={() => setAuthenticated(true)} />;

  const visible = filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter);
  return <div className="owner-app"><header className="owner-header"><a className="brand" href="/"><span className="brand-mark">S</span><span className="brand-copy"><strong>Sorella</strong><small>Owner desk</small></span></a><a className="back-link" href="/">View customer site <span>↗</span></a></header><main className="dashboard"><section className="dashboard-intro"><div><p className="eyebrow"><span></span> Reservation desk</p><h1>Tonight's <em>table.</em></h1><p className="intro-copy">New booking requests appear here as soon as a guest submits the form.</p></div><button className="refresh-button" onClick={loadBookings}><span>↻</span> Refresh</button></section><section className="stats"><div className="stat"><span>Pending requests</span><strong>{bookings.filter((booking) => booking.status === 'Pending').length}</strong></div><div className="stat"><span>Confirmed</span><strong>{bookings.filter((booking) => booking.status === 'Confirmed').length}</strong></div><div className="stat"><span>Total bookings</span><strong>{bookings.length}</strong></div></section><MenuManager /><OrderManager /><section className="bookings-section"><div className="section-heading"><div><p className="eyebrow"><span></span> Live inbox</p><h2>Booking requests</h2></div><label className="filter-label">Show <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All bookings</option><option value="Pending">Pending only</option><option value="Confirmed">Confirmed only</option><option value="Rejected">Rejected only</option></select></label></div><div className="booking-list">{visible.length ? visible.map((booking) => <article className={`booking-card ${booking.status.toLowerCase()}`} key={booking.id}><div className="booking-main"><div className="booking-title"><h3>{booking.name}</h3><span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></div><div className="booking-details"><span><b>When</b>{formatDate(booking.date)} at {booking.time}</span><span><b>Party</b>{booking.guests}</span>{(booking.email || booking.phone) && <span><b>Contact</b>{booking.email || booking.phone}</span>}</div></div><div className="booking-actions">{booking.status === 'Pending' && <><button className="confirm-button" onClick={() => changeStatus(booking.id, 'Confirmed')}>Confirm booking</button><button className="reject-button" onClick={() => changeStatus(booking.id, 'Rejected')}>Reject</button></>}{booking.status !== 'Pending' && <button className="delete-button" onClick={() => removeBooking(booking.id)}>Remove</button>}</div></article>) : <div className="empty-state"><span>✦</span><h3>No bookings yet</h3><p>New customer reservations will appear here.</p></div>}</div></section></main>{toast && <div className="toast show">{toast}</div>}</div>;
}

function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [selectedDishes, setSelectedDishes] = useState({});
  const [message, setMessage] = useState('');

  async function loadOrders() {
    try {
      setOrders(await api('/orders'));
      setMessage('');
    } catch (error) {
      setMessage(`Order API unavailable: ${error.message}`);
    }
  }

  useEffect(() => { loadOrders(); const interval = window.setInterval(loadOrders, 4000); return () => window.clearInterval(interval); }, []);

  useEffect(() => { api('/menu').then(setMenu).catch(() => setMessage('Menu API unavailable.')); }, []);

  async function updateOrder(id, status) {
    try {
      await api(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await loadOrders();
    } catch (error) {
      setMessage(`Could not update order: ${error.message}`);
    }
  }

  async function removeOrder(id) {
    try {
      await api(`/orders/${id}`, { method: 'DELETE' });
      await loadOrders();
    } catch (error) {
      setMessage(`Could not remove order: ${error.message}`);
    }
  }

  async function addItem(orderId) {
    const selection = selectedDishes[orderId];
    if (!selection?.dishId) return;
    try {
      await api(`/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify({ dishId: selection.dishId, quantity: selection.quantity || 1 }) });
      setSelectedDishes({ ...selectedDishes, [orderId]: { dishId: '', quantity: 1 } });
      await loadOrders();
    } catch (error) {
      setMessage(`Could not add item: ${error.message}`);
    }
  }

  function printBill(order) {
    const printWindow = window.open('', '_blank', 'width=720,height=800');
    if (!printWindow) {
      setMessage('Allow pop-ups to print the bill.');
      return;
    }
    const items = order.items.map((item) => `<tr><td>${item.quantity} x ${escapeHtml(item.name)}</td><td>$${(Number(item.price.replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}</td></tr>`).join('');
    printWindow.document.write(`<!doctype html><html><head><title>Sorella bill - ${escapeHtml(order.customerName)}</title><style>body{font:14px Arial,sans-serif;color:#17211c;max-width:620px;margin:40px auto;padding:0 24px}h1{font:32px Georgia,serif;margin:0 0 8px}p{color:#66715e}.meta{border-bottom:1px solid #d8d4c9;padding-bottom:18px;margin-bottom:18px}table{width:100%;border-collapse:collapse}td{padding:11px 0;border-bottom:1px solid #e5e1d8}td:last-child{text-align:right}.total{display:flex;justify-content:space-between;margin-top:22px;font-weight:bold;font-size:18px}.small{font-size:11px;color:#777}</style></head><body><h1>Sorella</h1><div class="meta"><p>Customer: ${escapeHtml(order.customerName)}</p><p>Order type: ${escapeHtml(order.orderType)} · Status: ${escapeHtml(order.status)}</p>${order.email ? `<p>Email: ${escapeHtml(order.email)}</p>` : ''}${order.phone ? `<p>Phone: ${escapeHtml(order.phone)}</p>` : ''}</div><table>${items}</table><div class="total"><span>Total</span><span>${escapeHtml(order.total)}</span></div><p class="small">Printed from the Sorella owner desk.</p><script>window.onload=()=>window.print();</script></body></html>`);
    printWindow.document.close();
  }

  return <section className="orders-section"><div className="section-heading"><div><p className="eyebrow"><span></span> Kitchen inbox</p><h2>Food orders</h2></div><span className="manager-note">New orders refresh automatically.</span></div>{message && <p className="manager-message">{message}</p>}<div className="order-list">{orders.length ? orders.map((order) => <article className="order-card" key={order.id}><div className="order-card-head"><div><h3>{order.customerName}</h3><span className={`status ${order.status.toLowerCase()}`}>{order.status}</span></div><strong>{order.total}</strong></div><p className="order-type">{order.orderType} {order.email && `· ${order.email}`} {order.phone && `· ${order.phone}`}</p><ul>{order.items.map((item) => <li key={item.id}>{item.quantity} × {item.name}</li>)}</ul>{order.orderType === 'Dine in' && <div className="add-to-bill"><select value={selectedDishes[order.id]?.dishId || ''} onChange={(event) => setSelectedDishes({ ...selectedDishes, [order.id]: { ...selectedDishes[order.id], dishId: event.target.value, quantity: selectedDishes[order.id]?.quantity || 1 } })}><option value="">Add dish to bill</option>{menu.map((dish) => <option key={dish.id} value={dish.id}>{dish.name} · {dish.price}</option>)}</select><input type="number" min="1" max="20" value={selectedDishes[order.id]?.quantity || 1} onChange={(event) => setSelectedDishes({ ...selectedDishes, [order.id]: { ...selectedDishes[order.id], quantity: event.target.value } })} aria-label="Extra dish quantity" /><button className="confirm-button" onClick={() => addItem(order.id)}>Add</button></div>}<div className="order-actions"><button className="print-button" onClick={() => printBill(order)}>Print bill</button>{order.status === 'Awaiting reservation' && <span className="manager-note">Waiting for reservation approval</span>}{order.status === 'New' && <button className="confirm-button" onClick={() => updateOrder(order.id, 'Preparing')}>Start preparing</button>}{order.status === 'Preparing' && <button className="confirm-button" onClick={() => updateOrder(order.id, 'Ready')}>Mark ready</button>}{order.status === 'Ready' && <button className="confirm-button" onClick={() => updateOrder(order.id, 'Completed')}>Complete order</button>}{order.status === 'New' && <button className="reject-button" onClick={() => updateOrder(order.id, 'Rejected')}>Reject</button>}{order.status !== 'New' && order.status !== 'Awaiting reservation' && <button className="delete-button" onClick={() => removeOrder(order.id)}>Remove</button>}</div></article>) : <div className="empty-state"><span>✦</span><h3>No food orders yet</h3><p>Customer orders will appear here.</p></div>}</div></section>;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function MenuManager() {
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category: '', name: '', description: '', price: '' });
  const [newCategory, setNewCategory] = useState('');
  const [message, setMessage] = useState('');

  async function loadMenu() {
    try {
      const [nextMenu, nextCategories] = await Promise.all([api('/menu'), api('/categories')]);
      setMenu(nextMenu);
      setCategories(nextCategories);
      setForm((current) => ({ ...current, category: nextCategories.includes(current.category) ? current.category : nextCategories[0] || '' }));
    } catch { setMessage('Menu API unavailable.'); }
  }

  useEffect(() => { loadMenu(); }, []);

  async function addDish(event) {
    event.preventDefault();
    try {
      await api('/menu', { method: 'POST', body: JSON.stringify(form) });
      setForm({ ...form, name: '', description: '', price: '' });
      setMessage('Dish added to the customer menu.');
      loadMenu();
    } catch (error) { setMessage(error.message); }
  }

  async function removeDish(id) {
    await api(`/menu/${id}`, { method: 'DELETE' });
    loadMenu();
  }

  async function addCategory(event) {
    event.preventDefault();
    try {
      const category = await api('/categories', { method: 'POST', body: JSON.stringify({ name: newCategory }) });
      setNewCategory('');
      setMessage('Category added.');
      loadMenu();
      setForm((current) => ({ ...current, category }));
    } catch (error) { setMessage(error.message); }
  }

  async function removeCategory(category) {
    try {
      await api(`/categories/${encodeURIComponent(category)}`, { method: 'DELETE' });
      setMessage('Category removed.');
      loadMenu();
    } catch (error) { setMessage(error.message); }
  }

  return <section className="menu-manager"><div className="section-heading"><div><p className="eyebrow"><span></span> Kitchen editor</p><h2>Manage dishes</h2></div><span className="manager-note">Changes publish to the customer site.</span></div><form className="category-form" onSubmit={addCategory}><label>New category<input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="e.g. specials" required /></label><button className="confirm-button" type="submit">Add category <span>+</span></button></form><div className="category-list">{categories.map((category) => <div className="category-chip" key={category}><span>{category.replaceAll('-', ' ')}</span><button className="delete-button" onClick={() => removeCategory(category)}>Remove</button></div>)}</div><form className="dish-form" onSubmit={addDish}><label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required>{categories.map((category) => <option key={category} value={category}>{category.replaceAll('-', ' ')}</option>)}</select></label><label>Dish name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Lemon ricotta ravioli" required /></label><label>Description<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Key ingredients" required /></label><label>Price<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="18" required /></label><button className="confirm-button" type="submit">Add dish <span>+</span></button></form>{message && <p className="manager-message">{message}</p>}<div className="dish-list">{menu.map((dish) => <div className="dish-row" key={dish.id}><div><strong>{dish.name}</strong><span>{dish.category.replaceAll('-', ' ')} · {dish.description}</span></div><div className="dish-row-actions"><b>{dish.price}</b><button className="delete-button" onClick={() => removeDish(dish.id)}>Remove</button></div></div>)}</div></section>;
}

function formatDate(date) { return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
export default function App() { return window.location.pathname.startsWith('/owner') ? <OwnerDashboard /> : window.location.pathname.startsWith('/bill/') ? <BillPage /> : <CustomerSite />; }
