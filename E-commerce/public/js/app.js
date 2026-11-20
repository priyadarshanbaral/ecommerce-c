const API = '/api';
let cartCount = 0;

// Utility ---------------------------------------------------------------------
function showAlert(message, type = 'success') {
  const el = document.getElementById('alert');
  if (!el) return;
  el.textContent = message;
  el.className = `alert ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function formatMoney(amount) {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount); }
  catch { return '$' + String(amount); }
}

function escapeHTML(str = '') {
  return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;" }[c]));
}

// API -------------------------------------------------------------------------
async function fetchJSON(input, options = {}) {
  const res = await fetch(input, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  let data;
  try { data = await res.json(); } catch (_) { data = {}; }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Auth ------------------------------------------------------------------------
async function checkAuth() {
  try {
    const data = await fetchJSON(`${API}/me`);
    return data.user || null;
  } catch (_) { return null; }
}

async function updateAuthUI() {
  const user = await checkAuth();
  const authLinks = document.getElementById('auth-links');
  const userMenu = document.getElementById('user-menu');
  const userNameEl = document.getElementById('user-name');
  if (user) {
    if (authLinks) authLinks.style.display = 'none';
    if (userMenu) { userMenu.style.display = 'flex'; if (userNameEl) userNameEl.textContent = 'Hi, ' + user.name; }
    await loadCartCount();
  } else {
    if (authLinks) authLinks.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    const badge = document.getElementById('cart-badge');
    const countEl = document.getElementById('cart-count');
    if (badge) badge.style.display = 'none';
    if (countEl) countEl.textContent = '0';
    cartCount = 0;
  }
  return user;
}

async function loadCartCount() {
  try {
    const items = await fetchJSON(`${API}/cart`);
    cartCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    const badge = document.getElementById('cart-badge');
    const countEl = document.getElementById('cart-count');
    if (badge && countEl) {
      countEl.textContent = cartCount;
      badge.style.display = cartCount > 0 ? 'inline-block' : 'none';
    }
  } catch (_) { cartCount = 0; }
}

async function addToCart(productId, quantity = 1) {
  try {
    await fetchJSON(`${API}/cart/add`, { method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) });
    await loadCartCount();
    showAlert('Added to cart');
  } catch (err) {
    if (err.message.includes('Authentication required') || err.message.includes('401')) {
      showAlert('Please log in to add items to cart', 'error');
      setTimeout(() => { window.location.href = 'auth.html'; }, 800);
      return;
    }
    showAlert(err.message, 'error');
  }
}

// Require auth, redirect to login if not --------------------------------------
async function requireAuth() {
  const user = await checkAuth();
  if (!user) {
    showAlert('Please log in to continue', 'error');
    setTimeout(() => { window.location.href = 'auth.html'; }, 600);
    return false;
  }
  return true;
}

// DOM ready -------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await updateAuthUI();

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try { await fetchJSON(`${API}/logout`, { method: 'POST' }); } catch (_) {}
      updateAuthUI();
      window.location.pathname = '/index.html';
    });
  }

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('login-msg');
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        await fetchJSON(`${API}/login`, { method: 'POST', body: JSON.stringify({ email, password }) });
        showAlert('Logged in');
        setTimeout(() => { window.location.pathname = '/index.html'; }, 600);
      } catch (err) {
        if (msg) { msg.textContent = err.message; msg.className = 'msg error'; msg.style.display = 'block'; }
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('register-msg');
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      try {
        await fetchJSON(`${API}/register`, { method: 'POST', body: JSON.stringify({ name, email, password }) });
        showAlert('Registered & logged in');
        setTimeout(() => { window.location.pathname = '/index.html'; }, 600);
      } catch (err) {
        if (msg) { msg.textContent = err.message; msg.className = 'msg error'; msg.style.display = 'block'; }
      }
    });
  }

  // Generic add-to-cart (product & detail pages)
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;
    if (btn.closest('.cart-row')) return;
    e.preventDefault();
    const id = btn.dataset.add;
    const qtyInput = document.querySelector(`[data-qty-for="${id}"]`);
    const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value, 10) || 1) : 1;
    addToCart(id, qty);
  });
});

// Global error fallback -------------------------------------------------------
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection:', e.reason);
  try { showAlert('Something went wrong. Please refresh.', 'error'); } catch (_) {}
});
