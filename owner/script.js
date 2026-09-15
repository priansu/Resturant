const storageKey = 'sorellaBookings';
const bookingList = document.querySelector('#booking-list');
const statusFilter = document.querySelector('#status-filter');
const toast = document.querySelector('#toast');

function getBookings() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '[]');
  } catch {
    return [];
  }
}

function saveBookings(bookings) {
  localStorage.setItem(storageKey, JSON.stringify(bookings));
}

function formatDate(date) {
  if (!date) return 'Date not selected';
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T12:00:00`));
}

function renderBookings() {
  const bookings = getBookings();
  const filter = statusFilter.value;
  const visibleBookings = filter === 'all' ? bookings : bookings.filter((booking) => booking.status === filter);

  document.querySelector('#new-count').textContent = bookings.filter((booking) => booking.status === 'New').length;
  document.querySelector('#confirmed-count').textContent = bookings.filter((booking) => booking.status === 'Confirmed').length;
  document.querySelector('#total-count').textContent = bookings.length;

  if (!visibleBookings.length) {
    bookingList.innerHTML = `<div class="empty-state"><span>✦</span><h3>No ${filter === 'all' ? '' : filter.toLowerCase() + ' '}bookings yet</h3><p>New customer reservations will appear here.</p></div>`;
    return;
  }

  bookingList.innerHTML = visibleBookings.map((booking) => `
    <article class="booking-card ${booking.status === 'Confirmed' ? 'is-confirmed' : ''}">
      <div class="booking-main">
        <div class="booking-title"><h3>${escapeHtml(booking.name)}</h3><span class="status ${booking.status.toLowerCase()}">${booking.status}</span></div>
        <div class="booking-details"><span><b>When</b>${formatDate(booking.date)} at ${escapeHtml(booking.time)}</span><span><b>Party</b>${escapeHtml(booking.guests)}</span></div>
      </div>
      <div class="booking-actions">
        ${booking.status === 'New' ? `<button class="confirm-button" data-action="confirm" data-id="${booking.id}">Confirm booking</button><button class="reject-button" data-action="reject" data-id="${booking.id}">Reject</button>` : ''}
        ${booking.status !== 'New' ? `<button class="delete-button" data-action="delete" data-id="${booking.id}" aria-label="Delete booking for ${escapeHtml(booking.name)}">Remove</button>` : ''}
      </div>
    </article>
  `).join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 2500);
}

bookingList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const bookings = getBookings();
  const booking = bookings.find((item) => item.id === button.dataset.id);
  if (!booking) return;

  if (button.dataset.action === 'confirm') {
    booking.status = 'Confirmed';
    saveBookings(bookings);
    showToast('Booking confirmed');
  } else if (button.dataset.action === 'reject') {
    booking.status = 'Rejected';
    saveBookings(bookings);
    showToast('Booking rejected');
  } else {
    saveBookings(bookings.filter((item) => item.id !== booking.id));
    showToast('Booking deleted');
  }
  renderBookings();
});

document.querySelector('#refresh-bookings').addEventListener('click', renderBookings);
statusFilter.addEventListener('change', renderBookings);
window.addEventListener('storage', renderBookings);
renderBookings();
