import { useEffect, useState } from 'react';

const menuItems = {
  antipasti: [
    ['Burrata & the good tomatoes', 'Basil oil, sea salt, toasted sourdough', '$16'],
    ['Polpette della nonna', 'Beef + pork meatballs, spicy sugo, pecorino', '$15'],
    ['Fried artichokes', 'Lemon, parsley, whipped ricotta', '$14']
  ],
  pasta: [
    ['Cacio e pepe', 'Tonnarelli, pecorino romano, black pepper', '$19'],
    ['Rigatoni alla vodka', 'Calabrian chili, tomato, parmesan, basil', '$21'],
    ['Tagliatelle al ragu', 'Slow-cooked beef, pork, soffritto, parmigiano', '$23']
  ],
  secondi: [
    ['Chicken al mattone', 'Castelvetrano olives, lemon, spring greens', '$29'],
    ['Branzino alla griglia', 'Fennel, orange, salsa verde', '$32'],
    ['Eggplant parmigiana', 'San Marzano tomato, mozzarella, basil', '$24']
  ],
  dolci: [
    ['Tiramisu', 'Espresso, mascarpone, cocoa, ladyfingers', '$11'],
    ['Olive oil cake', 'Citrus curd, rosemary, crema', '$10'],
    ['Affogato', 'Vanilla gelato, hot espresso, biscotti', '$8']
  ]
};

const api = async (path, options) => {
  const response = await fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) throw new Error((await response.json()).error || 'Request failed');
  return response.status === 204 ? null : response.json();
};

function CustomerSite() {
  const [category, setCategory] = useState('antipasti');
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [toast, setToast] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const bookingId = localStorage.getItem('sorellaLastBookingId');
    if (!bookingId) return undefined;
    const loadStatus = async () => {
      try {
        const bookings = await api('/bookings');
        setStatus(bookings.find((booking) => booking.id === bookingId) || null);
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
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const booking = await api('/bookings', { method: 'POST', body: JSON.stringify(data) });
      localStorage.setItem('sorellaLastBookingId', booking.id);
      setStatus(booking);
      setModalOpen(false);
      event.currentTarget.reset();
      setToast('Your table request is in. See you soon!');
      window.setTimeout(() => setToast(''), 4000);
    } catch {
      setToast('We could not send that request. Please try again.');
    }
  }

  return <>
    <div className="announcement">Kitchen open until 11pm tonight <span>•</span> Walk-ins welcome at the bar</div>
    <header className="site-header" id="top">
      <a className="brand" href="#top" aria-label="Sorella home"><span className="brand-mark">S</span><span className="brand-copy"><strong>Sorella</strong><small>Italian kitchen</small></span></a>
      <nav className="desktop-nav" aria-label="Main navigation"><a href="#menu">Menu</a><a href="#story">Our story</a><a href="#visit">Visit us</a></nav>
      <button className="button button-dark header-cta" onClick={() => setModalOpen(true)}>Book a table <span>↗</span></button>
      <button className="menu-toggle" aria-label="Open menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}><span></span><span></span></button>
    </header>
    <div className={`mobile-nav ${mobileOpen ? 'open' : ''}`} aria-hidden={!mobileOpen}><a href="#menu" onClick={() => setMobileOpen(false)}>Menu</a><a href="#story" onClick={() => setMobileOpen(false)}>Our story</a><a href="#visit" onClick={() => setMobileOpen(false)}>Visit us</a><button className="button button-dark" onClick={() => { setMobileOpen(false); setModalOpen(true); }}>Book a table <span>↗</span></button></div>

    <main>
      <section className="hero section-pad"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"></span> Little Italy, big heart</p><h1>Come for the<br /><em>pasta.</em> Stay for<br />the stories.</h1><p className="hero-intro">A neighborhood kitchen with a soft spot for handmade pasta, long lunches, and the people who make a table feel like home.</p><div className="hero-actions"><button className="button button-primary" onClick={() => setModalOpen(true)}>Reserve your table <span>↗</span></button><a className="text-link" href="#menu">Explore the menu <span>↓</span></a></div><div className="hero-note"><span className="note-dot"></span><span>Now serving our spring menu</span><span className="note-rule"></span><span>Est. 2018</span></div></div><div className="hero-visual"><div className="hero-image-wrap"><img src="https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=1300&q=88" alt="Fresh pasta being served on a ceramic plate" /></div><div className="image-caption"><span>01</span><span>made by hand,<br />served with heart</span></div><div className="hero-stamp"><span>Buon<br />appetito</span><span className="stamp-star">✦</span></div></div></section>
      <section className="marquee" aria-label="Restaurant highlights"><div className="marquee-track"><span>HANDMADE DAILY</span><i>✦</i><span>SEASONAL INGREDIENTS</span><i>✦</i><span>GOOD WINE</span><i>✦</i><span>LONG LUNCHES</span></div></section>
      <section className="story section-pad" id="story"><div className="section-label"><span>02</span><span>What we believe</span></div><div className="story-grid"><div className="story-heading"><h2>Simple food.<br /><em>Big feeling.</em></h2><span className="scribble">~</span></div><div className="story-copy"><p className="large-copy">We cook the kind of food that makes you loosen your belt and stay a little longer.</p><p>At Sorella, everything starts with the best ingredients we can find and the recipes we grew up with. Nothing fussy. Just generous plates, good wine, and a room full of people you want to be around.</p><a className="text-link" href="#visit">Meet us properly <span>↗</span></a></div></div></section>
      <section className="menu-section section-pad" id="menu"><div className="menu-heading"><div className="section-label"><span>03</span><span>From the kitchen</span></div><div><h2>Tonight's<br /><em>favorites.</em></h2><p>Built around the market, finished with a little magic.</p></div></div><div className="menu-tabs" role="tablist">{Object.keys(menuItems).map((item) => <button className={`tab ${category === item ? 'active' : ''}`} key={item} onClick={() => setCategory(item)}>{item === 'pasta' ? 'Pasta + pizza' : item}</button>)}</div><div className="menu-list">{menuItems[category].map(([name, description, price]) => <article className="menu-item" key={name}><div><h3>{name}</h3><p>{description}</p></div><span className="menu-item-price">{price}</span></article>)}</div></section>
      <section className="reservation-banner section-pad" id="visit"><div className="reservation-inner"><div><p className="eyebrow light"><span className="eyebrow-line"></span> Your table is waiting</p><h2>Make a night<br /><em>of it.</em></h2></div><div className="reservation-side"><p>Come as you are. Bring someone you love. We'll take care of the rest.</p><button className="button button-light" onClick={() => setModalOpen(true)}>Book a table <span>↗</span></button></div></div></section>
    </main>
    <footer className="site-footer"><a className="brand" href="#top"><span className="brand-mark">S</span><span className="brand-copy"><strong>Sorella</strong><small>Italian kitchen</small></span></a><p>Come hungry, leave happy.</p><div className="footer-links"><a href="#menu">Instagram</a><a href="#visit">Contact</a><a href="#top">Back to top ↑</a></div></footer>

    {modalOpen && <div className="modal-backdrop open" onClick={(event) => event.target === event.currentTarget && setModalOpen(false)}><div className="reservation-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-title"><button className="modal-close" aria-label="Close reservation dialog" onClick={() => setModalOpen(false)}>×</button><p className="eyebrow"><span className="eyebrow-line"></span> A table for you</p><h2 id="reservation-title">Let's make<br /><em>plans.</em></h2><form onSubmit={submitReservation}><div className="form-row"><label>Name<input type="text" name="name" placeholder="Your name" required /></label><label>Guests<select name="guests"><option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option></select></label></div><div className="form-row"><label>Date<input type="date" name="date" required /></label><label>Time<select name="time"><option>6:00 pm</option><option>6:30 pm</option><option>7:00 pm</option><option>7:30 pm</option><option>8:00 pm</option><option>8:30 pm</option></select></label></div><button className="button button-primary form-submit" type="submit">Send request <span>↗</span></button><p className="form-note">The owner will confirm your request.</p></form></div></div>}
    {status && <aside className={`reservation-status ${status.status.toLowerCase()}`}><div><span className="status-kicker">Latest reservation</span><strong>{status.status}</strong><p>{status.status === 'Pending' ? 'Your request is pending confirmation from Sorella.' : status.status === 'Confirmed' ? 'Your reservation is confirmed. We look forward to seeing you.' : 'This request was not accepted. Please choose another time or contact us.'}</p></div></aside>}
    {toast && <div className="toast show" role="status">{toast}</div>}
  </>;
}

function OwnerDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState('');

  async function loadBookings() {
    try { setBookings(await api('/bookings')); } catch { setToast('API unavailable. Start the Node server first.'); }
  }
  useEffect(() => { loadBookings(); const interval = window.setInterval(loadBookings, 4000); return () => window.clearInterval(interval); }, []);

  async function changeStatus(id, status) {
    await api(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await loadBookings();
    setToast(`Booking ${status.toLowerCase()}`);
    window.setTimeout(() => setToast(''), 2500);
  }
  async function removeBooking(id) { await api(`/bookings/${id}`, { method: 'DELETE' }); await loadBookings(); }

  const visible = filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter);
  return <div className="owner-app"><header className="owner-header"><a className="brand" href="/"><span className="brand-mark">S</span><span className="brand-copy"><strong>Sorella</strong><small>Owner desk</small></span></a><a className="back-link" href="/">View customer site <span>↗</span></a></header><main className="dashboard"><section className="dashboard-intro"><div><p className="eyebrow"><span></span> Reservation desk</p><h1>Tonight's <em>table.</em></h1><p className="intro-copy">New booking requests appear here as soon as a guest submits the form.</p></div><button className="refresh-button" onClick={loadBookings}><span>↻</span> Refresh</button></section><section className="stats"><div className="stat"><span>Pending requests</span><strong>{bookings.filter((booking) => booking.status === 'Pending').length}</strong></div><div className="stat"><span>Confirmed</span><strong>{bookings.filter((booking) => booking.status === 'Confirmed').length}</strong></div><div className="stat"><span>Total bookings</span><strong>{bookings.length}</strong></div></section><section className="bookings-section"><div className="section-heading"><div><p className="eyebrow"><span></span> Live inbox</p><h2>Booking requests</h2></div><label className="filter-label">Show <select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All bookings</option><option value="Pending">Pending only</option><option value="Confirmed">Confirmed only</option><option value="Rejected">Rejected only</option></select></label></div><div className="booking-list">{visible.length ? visible.map((booking) => <article className={`booking-card ${booking.status.toLowerCase()}`} key={booking.id}><div className="booking-main"><div className="booking-title"><h3>{booking.name}</h3><span className={`status ${booking.status.toLowerCase()}`}>{booking.status}</span></div><div className="booking-details"><span><b>When</b>{formatDate(booking.date)} at {booking.time}</span><span><b>Party</b>{booking.guests}</span></div></div><div className="booking-actions">{booking.status === 'Pending' && <><button className="confirm-button" onClick={() => changeStatus(booking.id, 'Confirmed')}>Confirm booking</button><button className="reject-button" onClick={() => changeStatus(booking.id, 'Rejected')}>Reject</button></>}{booking.status !== 'Pending' && <button className="delete-button" onClick={() => removeBooking(booking.id)}>Remove</button>}</div></article>) : <div className="empty-state"><span>✦</span><h3>No bookings yet</h3><p>New customer reservations will appear here.</p></div>}</div></section></main>{toast && <div className="toast show">{toast}</div>}</div>;
}

function formatDate(date) { return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`)); }
export default function App() { return window.location.pathname.startsWith('/owner') ? <OwnerDashboard /> : <CustomerSite />; }
