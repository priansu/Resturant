const menuItems = {
  antipasti: [
    { name: 'Burrata & the good tomatoes', description: 'Basil oil, sea salt, toasted sourdough', price: '$16' },
    { name: 'Polpette della nonna', description: 'Beef + pork meatballs, spicy sugo, pecorino', price: '$15' },
    { name: 'Fried artichokes', description: 'Lemon, parsley, whipped ricotta', price: '$14' }
  ],
  pasta: [
    { name: 'Cacio e pepe', description: 'Tonnarelli, pecorino romano, black pepper', price: '$19' },
    { name: 'Rigatoni alla vodka', description: 'Calabrian chili, tomato, parmesan, basil', price: '$21' },
    { name: 'Tagliatelle al ragu', description: 'Slow-cooked beef, pork, soffritto, parmigiano', price: '$23' }
  ],
  secondi: [
    { name: 'Chicken al mattone', description: 'Castelvetrano olives, lemon, spring greens', price: '$29' },
    { name: 'Branzino alla griglia', description: 'Fennel, orange, salsa verde', price: '$32' },
    { name: 'Eggplant parmigiana', description: 'San Marzano tomato, mozzarella, basil', price: '$24' }
  ],
  dolci: [
    { name: 'Tiramisu', description: 'Espresso, mascarpone, cocoa, ladyfingers', price: '$11' },
    { name: 'Olive oil cake', description: 'Citrus curd, rosemary, crema', price: '$10' },
    { name: 'Affogato', description: 'Vanilla gelato, hot espresso, biscotti', price: '$8' }
  ]
};

const menuList = document.querySelector('#menu-list');
const tabs = document.querySelectorAll('.tab');

function renderMenu(category) {
  menuList.innerHTML = menuItems[category].map((item) => `
    <article class="menu-item">
      <div><h3>${item.name}</h3><p>${item.description}</p></div>
      <span class="menu-item-price">${item.price}</span>
    </article>
  `).join('');
}

renderMenu('antipasti');
tabs.forEach((tab) => tab.addEventListener('click', () => {
  tabs.forEach((item) => item.classList.remove('active'));
  tab.classList.add('active');
  renderMenu(tab.dataset.category);
}));

const modal = document.querySelector('.modal-backdrop');
const closeModalButton = document.querySelector('.modal-close');
const openButtons = document.querySelectorAll('[data-open-reservation]');
const firstInput = document.querySelector('input[name="name"]');

function openModal() {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  window.setTimeout(() => firstInput.focus(), 100);
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

openButtons.forEach((button) => button.addEventListener('click', openModal));
closeModalButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

document.querySelector('#reservation-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const booking = {
    id: `booking-${Date.now()}`,
    name: formData.get('name'),
    guests: formData.get('guests'),
    date: formData.get('date'),
    time: formData.get('time'),
    status: 'New',
    createdAt: new Date().toISOString()
  };
  const bookings = JSON.parse(localStorage.getItem('sorellaBookings') || '[]');
  localStorage.setItem('sorellaBookings', JSON.stringify([booking, ...bookings]));
  localStorage.setItem('sorellaLastBookingId', booking.id);
  closeModal();
  const toast = document.querySelector('.toast');
  toast.classList.add('show');
  event.target.reset();
  window.setTimeout(() => toast.classList.remove('show'), 4000);
  updateReservationStatus();
});

function updateReservationStatus() {
  const statusPanel = document.querySelector('#reservation-status');
  const lastBookingId = localStorage.getItem('sorellaLastBookingId');
  const booking = JSON.parse(localStorage.getItem('sorellaBookings') || '[]').find((item) => item.id === lastBookingId);
  if (!booking) {
    statusPanel.hidden = true;
    return;
  }
  const messages = {
    New: 'Your request is pending confirmation from Sorella.',
    Confirmed: 'Your reservation is confirmed. We look forward to seeing you.',
    Rejected: 'This request was not accepted. Please choose another time or contact us.'
  };
  statusPanel.hidden = false;
  statusPanel.dataset.status = booking.status.toLowerCase();
  statusPanel.querySelector('strong').textContent = booking.status === 'New' ? 'Pending' : booking.status;
  statusPanel.querySelector('p').textContent = messages[booking.status];
}

window.addEventListener('storage', updateReservationStatus);
updateReservationStatus();

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
menuToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  mobileNav.setAttribute('aria-hidden', String(!isOpen));
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  mobileNav.setAttribute('aria-hidden', 'true');
}));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
