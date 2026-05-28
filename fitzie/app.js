/**
 * Fitzie Web Store - Core Application Logic
 * Pure ES6 Vanilla Javascript for state management and interactive features.
 */

// Verify script loaded
console.log('Fitzie app.js loaded');

// --- PRODUCT DATA SCHEMA ---
const PRODUCTS_DATA = [
  {
    id: 'apex-rugby',
    name: 'Apex Rugby Compression Top',
    category: 'compression',
    price: 44.00,
    image: 'assets/fitzie_blue_rugby.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.8,
    reviews: 98,
    slogan: 'Performance-fit rugby cut engineered for explosive upper-body movement.',
    description: 'The Apex Rugby Compression Top brings together classic athletic cut with modern compression technology. Built for contact sports and high-intensity training, it features reinforced shoulder panels, moisture-wicking fabric, and a streamlined fit that moves with every tackle and sprint.',
    specs: {
      fabric: '85% Recycled Polyester, 15% Elastane performance knit.',
      fit: 'Athletic compression fit. Close to body without restricting motion.',
      care: 'Machine wash cold, tumble dry low. Do not use fabric softener.'
    }
  },
  {
    id: 'stealth-joggers',
    name: 'Stealth Tech Joggers',
    category: 'bottoms',
    price: 52.00,
    image: 'assets/fitzie_jogger.jpg',
    sizes: ['M', 'L', 'XL', 'XXL'],
    rating: 4.7,
    reviews: 156,
    slogan: 'Streamlined technical joggers for urban mobility and daily training.',
    description: 'Our Stealth Tech Joggers are precision-cut from lightweight stretch fabric with a tapered leg and elastic cuffs. Featuring zip-secure pockets, a drawcord waist, and subtle reflective detailing, they bridge the gap between gym performance and everyday street comfort.',
    specs: {
      fabric: '90% Nylon, 10% Elastane with DWR water-resistant coating.',
      fit: 'Slim tapered fit. True to size for an active silhouette.',
      care: 'Machine wash cold, hang dry. Do not iron.'
    }
  },
  {
    id: 'terra-jacket',
    name: 'Terra Field Shell Jacket',
    category: 'hoodies',
    price: 78.00,
    image: 'assets/fitzie_green_jacket.jpg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.9,
    reviews: 203,
    slogan: 'Weather-ready field jacket with technical shell construction.',
    description: 'The Terra Field Shell Jacket is built for the elements. A lightweight yet durable outer shell with sealed seams, adjustable hood, and multiple utility pockets. Designed for trail runs, outdoor training, and tactical daily wear with a clean, modern silhouette.',
    specs: {
      fabric: '100% Nylon Ripstop with breathable PU membrane.',
      fit: 'Regular fit with room for light layering underneath.',
      care: 'Machine wash cold, tumble dry low. Reapply DWR coating as needed.'
    }
  },
  {
    id: 'crimson-jacket',
    name: 'Crimson Trail Jacket',
    category: 'hoodies',
    price: 72.00,
    image: 'assets/fitzie_red_jacket.jpg',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.8,
    reviews: 178,
    slogan: 'Bold trail-ready jacket with wind-resistant shell and urban edge.',
    description: 'The Crimson Trail Jacket delivers wind-resistant protection with a street-ready aesthetic. Lightweight and packable, it features a high collar, zippered hand pockets, and adjustable hem. Perfect for transitional weather and active commutes.',
    specs: {
      fabric: '92% Recycled Polyester, 8% Elastane with wind-resistant finish.',
      fit: 'Slim street fit. Size up for a relaxed layering look.',
      care: 'Machine wash cold, hang dry. Do not bleach.'
    }
  }
];

// --- APP STATE ---
let state = {
  cart: [],
  activeFilter: 'all',
  searchQuery: '',
  activeProduct: null,
  checkoutStep: 1, // 1: Shipping, 2: Payment, 3: Success
  deliveryRegion: 'inside', // inside, outside
  paymentMethod: 'bkash', // bkash, nagad
  quizStep: 1, // 1: Height, 2: Weight, 3: Fit, 4: Result
  quizData: {
    height: 175, // cm
    weight: 70,  // kg
    fit: 'regular' // regular, tight, oversized
  }
};

const FREE_SHIPPING_THRESHOLD = 100.00;

// --- ORDER EMAIL ---
const W3F_KEY = 'cecdd64e-d5f8-4b19-80f2-7eb8b69ae415';
const SHOP_EMAIL = 'dopamine9doses@gmail.com';

function sendOrderEmail(orderData) {
  saveOrderLocally(orderData);

  const itemsText = orderData.items.map(i =>
    `${i.product.name} (Size: ${i.size}) x ${i.quantity} - $${(i.product.price * i.quantity).toFixed(2)}`
  ).join('\n');

  // Submit to Web3Forms via hidden iframe (no tabs, no popups)
  const iframe = document.createElement('iframe');
  iframe.name = 'w3f-' + Date.now();
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const form = document.createElement('form');
  form.action = 'https://api.web3forms.com/submit';
  form.method = 'POST';
  form.target = iframe.name;
  form.style.display = 'none';

  const add = (n, v) => {
    const el = document.createElement('input');
    el.type = 'hidden'; el.name = n; el.value = v;
    form.appendChild(el);
  };

  add('access_key', W3F_KEY);
  add('subject', 'New Fitzie Order - ' + orderData.name);
  add('from_name', orderData.name);
  add('Customer Email', orderData.email);
  add('Address', orderData.address + ', ' + orderData.city + ' - ' + orderData.zip);
  add('Region', orderData.region);
  add('Payment Method', orderData.paymentMethod);
  add('Sender Number', orderData.senderNumber);
  add('Transaction ID', orderData.txnId);
  add('Items Ordered', itemsText);
  add('Total', '$' + orderData.total);

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    document.body.removeChild(form);
    document.body.removeChild(iframe);
  }, 2000);
  showToast('ORDER SENT', 'Email sent to shop + saved locally.');
}

// --- LOCAL ORDER STORAGE ---
function saveOrderLocally(orderData) {
  const orders = JSON.parse(localStorage.getItem('fitzie_orders') || '[]');
  orders.unshift({ ...orderData, date: new Date().toISOString() });
  localStorage.setItem('fitzie_orders', JSON.stringify(orders));
}

// --- ADMIN PANEL ---
function openAdminPanel() {
  const orders = JSON.parse(localStorage.getItem('fitzie_orders') || '[]');
  if (orders.length === 0) {
    showToast('NO ORDERS', 'No orders have been placed yet.');
    return;
  }

  let html = orders.map((o, i) => `
    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;padding:20px;margin-bottom:16px;text-align:left">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px">
        <strong>#${i + 1}</strong>
        <span style="color:var(--text-muted);font-size:0.8rem">${new Date(o.date).toLocaleString()}</span>
      </div>
      <div style="font-size:0.85rem;color:var(--text-muted);display:grid;gap:4px">
        <div><strong style="color:var(--text-white)">${o.name}</strong> — ${o.email}</div>
        <div>${o.address}, ${o.city} (${o.region})</div>
        <div>${o.paymentMethod} — ${o.senderNumber} — Txn: ${o.txnId}</div>
        <div style="margin-top:6px;border-top:1px solid var(--border-color);padding-top:6px">
          ${o.items.map(item => `${item.product.name} (${item.size}) x ${item.quantity} — $${(item.product.price * item.quantity).toFixed(2)}`).join('<br>')}
        </div>
        <div style="margin-top:6px;font-weight:700;color:var(--accent-neon)">Total: $${o.total}</div>
      </div>
    </div>
  `).join('');

  // Use the quiz modal as a reusable modal
  const existing = document.getElementById('admin-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'admin-modal';
  modal.className = 'modal-overlay active';
  modal.innerHTML = `
    <div class="modal-container quiz-modal" style="width:650px;display:block;padding:40px;max-height:90vh;overflow-y:auto">
      <button class="modal-close" onclick="this.closest('.modal-overlay').classList.remove('active');this.closest('.modal-overlay').remove()" style="top:20px;right:20px;background:none;border:none;color:white;font-size:1.5rem;cursor:pointer;position:absolute"><i class="bi bi-x-lg"></i></button>
      <h3 style="font-size:1.5rem;text-transform:uppercase;margin-bottom:20px">ORDERS <span style="color:var(--accent-neon)">DASHBOARD</span></h3>
      <p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:24px">Total orders: ${orders.length}</p>
      ${html}
    </div>
  `;
  document.body.appendChild(modal);
}

// --- HOMEPAGE ANIMATIONS ---
function initHeroAnimations() {
  createFloatingShapes();
  initHeroCanvas();
  animateHeroStats();
}

function animateHeroStats() {
  const stats = document.querySelectorAll('.stat-num');
  stats.forEach(stat => {
    const text = stat.textContent.trim();
    const numMatch = text.match(/(\d+)/);
    if (!numMatch) return;

    const target = parseInt(numMatch[0]);
    const suffix = text.replace(numMatch[0], '');
    let current = 0;
    const duration = 1500;
    const startTime = performance.now();

    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.floor(eased * target);
      stat.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(update);
      else stat.textContent = target + suffix;
    }

    // Start animation when stat enters viewport
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(update);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    observer.observe(stat);
  });
}

function createFloatingShapes() {
  const container = document.getElementById('float-shapes');
  if (!container) return;

  const shapes = [
    { type: 'circle', size: 40, top: '10%', left: '5%', duration: '25s', delay: '0s' },
    { type: 'square', size: 30, top: '60%', left: '85%', duration: '20s', delay: '1s' },
    { type: 'diamond', size: 35, top: '75%', left: '15%', duration: '22s', delay: '2s' },
    { type: 'circle', size: 20, top: '30%', left: '90%', duration: '18s', delay: '0.5s' },
    { type: 'square', size: 25, top: '85%', left: '70%', duration: '28s', delay: '1.5s' },
    { type: 'triangle', size: 50, top: '20%', left: '50%', duration: '30s', delay: '3s' },
    { type: 'circle', size: 15, top: '50%', left: '10%', duration: '15s', delay: '0s' },
    { type: 'diamond', size: 30, top: '40%', left: '70%', duration: '24s', delay: '2s' },
    { type: 'square', size: 45, top: '5%', left: '30%', duration: '26s', delay: '1s' },
  ];

  shapes.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = `float-shape ${s.type}`;
    el.style.width = s.type === 'triangle' ? '0' : `${s.size}px`;
    el.style.height = s.type === 'triangle' ? '0' : `${s.size}px`;
    el.style.top = s.top;
    el.style.left = s.left;
    el.style.animation = `floatShape${(i % 3) + 1} ${s.duration} infinite ease-in-out`;
    el.style.animationDelay = s.delay;

    if (s.type === 'triangle') {
      const borderSize = s.size * 0.6;
      el.style.borderLeft = `${borderSize}px solid transparent`;
      el.style.borderRight = `${borderSize}px solid transparent`;
      el.style.borderBottom = `${s.size}px solid rgba(220, 38, 38, 0.1)`;
    }

    container.appendChild(el);
  });
}

function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let w, h;
  const particles = [];
  const COUNT = 50;

  function resize() {
    const hero = canvas.parentElement;
    w = canvas.width = hero.offsetWidth;
    h = canvas.height = hero.offsetHeight;
  }

  function createParticles() {
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.1
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, w, h);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 38, 38, ${p.alpha})`;
      ctx.fill();
    });

    // Draw connecting lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(220, 38, 38, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  resize();
  createParticles();
  animate();

  window.addEventListener('resize', () => {
    resize();
    particles.length = 0;
    createParticles();
  });
}

// --- SCROLL REVEAL ANIMATIONS ---
// --- 3D TILT ON PRODUCT CARDS ---
function initCardTilt() {
  document.addEventListener('mousemove', (e) => {
    document.querySelectorAll('.product-card').forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.setProperty('--rx', rotateX + 'deg');
      card.style.setProperty('--ry', rotateY + 'deg');
    });
  });
}

// Apply tilt on hover via CSS
const tiltStyle = document.createElement('style');
tiltStyle.textContent = `
  .product-card:hover { transform: translateY(-8px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) !important; }
  .product-card { transition: transform 0.15s ease-out !important; }
`;
document.head.appendChild(tiltStyle);

// --- CURSOR GLOW TRAIL ---
function initCursorTrail() {
  const canvas = document.getElementById('cursor-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, mouse = { x: -100, y: -100 };
  const trail = [];
  const MAX = 25;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    trail.push({ x: mouse.x, y: mouse.y, life: 1 });
    if (trail.length > MAX) trail.shift();
  });

  function animateTrail() {
    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      p.life -= 0.025;
      if (p.life <= 0) continue;
      const alpha = p.life * 0.2;
      const size = p.life * 6 + 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 38, 38, ${alpha})`;
      ctx.fill();
    }
    trail.forEach((p, i) => { if (p.life <= 0) trail.splice(i, 1); });
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
}

// --- ENHANCED SCROLL REVEAL WITH SCALE ---
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  const observeCards = () => {
    document.querySelectorAll('.product-card').forEach((card, i) => {
      card.classList.add('reveal');
      card.classList.add(`reveal-delay-${(i % 5) + 1}`);
      observer.observe(card);
    });
  };

  const origRender = renderProducts;
  const renderProxy = function() {
    origRender.call(this);
    setTimeout(observeCards, 50);
  };
  window.renderProducts = renderProxy;

  document.querySelectorAll('.section-header, .quiz-promo-banner, .hero-text, .hero-image-container').forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(observeCards, 100));
  });

  document.getElementById('search-input')?.addEventListener('input', () => setTimeout(observeCards, 100));
  setTimeout(observeCards, 200);
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadCartFromStorage();
  initWelcomeScreen();
  initHeaderScroll();
  initShopFilters();
  initSearch();
  renderProducts();
  initCartDrawer();
  initProductModal();
  initCheckout();
  initQuiz();
  initNewsletter();
  initHeroAnimations();
  initScrollReveal();
  initCardTilt();
  initCursorTrail();
  updateCartCounters();
});

// --- STATE STORAGE ---
function saveCartToStorage() {
  localStorage.setItem('fitzie_cart', JSON.stringify(state.cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem('fitzie_cart');
  if (saved) {
    try {
      state.cart = JSON.parse(saved);
    } catch (e) {
      state.cart = [];
    }
  }
}

// --- WELCOME INTERACTION (INTERACTIVE ANIMATED INTRO) ---
function initWelcomeScreen() {
  const overlay = document.getElementById('welcome-overlay');
  const enterBtn = document.getElementById('enter-btn');
  const cursorGlow = document.getElementById('welcome-cursor-glow');
  
  if (enterBtn && overlay) {
    // Interactive cursor light tracker
    if (cursorGlow) {
      overlay.addEventListener('mousemove', (e) => {
        const rect = overlay.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        cursorGlow.style.left = `${x}px`;
        cursorGlow.style.top = `${y}px`;
        cursorGlow.style.opacity = '1';
      });
      
      overlay.addEventListener('mouseleave', () => {
        cursorGlow.style.opacity = '0';
      });
    }

    enterBtn.addEventListener('click', (e) => {
      // Only handle if not already handled by inline onclick
      if (overlay.classList.contains('hidden')) return;
      overlay.classList.add('hidden');
      
      // Allow visual fade-out/scale-warp animation to complete before restoring scroll
      setTimeout(() => {
        document.body.style.overflowY = 'auto';
        overlay.style.display = 'none'; // Unmount to free GPU/CPU memory
      }, 800);
    });
    
    // Lock scroll bar during introduction welcome
    document.body.style.overflow = 'hidden';
  }
}

// --- HEADER BLUR ON SCROLL ---
function initHeaderScroll() {
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// --- PRODUCT GRID RENDERING ---
function initShopFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Toggle active classes
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Update state and render
      state.activeFilter = e.target.getAttribute('data-filter');
      renderProducts();
    });
  });
}

function initSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      renderProducts();
    });
  }
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;
  
  // Filter products
  const filtered = PRODUCTS_DATA.filter(prod => {
    const matchesCategory = state.activeFilter === 'all' || prod.category === state.activeFilter;
    const matchesSearch = prod.name.toLowerCase().includes(state.searchQuery) || 
                          prod.slogan.toLowerCase().includes(state.searchQuery) ||
                          prod.category.toLowerCase().includes(state.searchQuery);
    return matchesCategory && matchesSearch;
  });
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <i class="bi bi-search" style="font-size: 2.5rem; margin-bottom: 20px; display: block;"></i>
        <p style="text-transform: uppercase; font-size: 0.9rem; font-weight: 700; letter-spacing: 0.05em;">No gear fits your query</p>
        <p style="font-size: 0.8rem; margin-top: 5px;">Try checking another category or refining your keyword.</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = filtered.map(prod => {
    // Generate size tags for quick add
    const sizeOptionsHTML = prod.sizes.map(size => `
      <button class="quick-size-btn" data-id="${prod.id}" data-size="${size}">${size}</button>
    `).join('');
    
    // Rating stars HTML
    const fullStars = Math.floor(prod.rating);
    const halfStar = prod.rating % 1 !== 0;
    let starsHTML = '';
    for(let i=0; i<5; i++) {
      if (i < fullStars) {
        starsHTML += '<i class="bi bi-star-fill"></i>';
      } else if (i === fullStars && halfStar) {
        starsHTML += '<i class="bi bi-star-half"></i>';
      } else {
        starsHTML += '<i class="bi bi-star"></i>';
      }
    }
    
    return `
      <div class="product-card" data-id="${prod.id}">
        <div class="product-image-wrapper">
          <span class="product-badge">New In</span>
          <img class="product-img" src="${prod.image}" alt="${prod.name}">
          
          <div class="product-quick-add">
            <span class="size-title" style="text-align: center; font-size: 0.7rem; color: var(--text-muted);">QUICK ADD SIZE</span>
            <div class="quick-size-list">
              ${sizeOptionsHTML}
            </div>
            <button class="quick-add-submit-btn" disabled data-id="${prod.id}">CHOOSE SIZE FIRST</button>
          </div>
        </div>
        
        <div class="product-info">
          <span class="product-cat">${prod.category}</span>
          <div class="product-name-row">
            <h3 class="product-title">${prod.name}</h3>
            <span class="product-price">$${prod.price.toFixed(2)}</span>
          </div>
          <p class="product-desc-snippet">${prod.slogan}</p>
          
          <div class="product-card-footer">
            <div class="rating-block">
              ${starsHTML}
              <span class="rating-count">(${prod.reviews})</span>
            </div>
            <div class="view-details-txt" onclick="openProductModal('${prod.id}')">
              Gear Details <i class="bi bi-arrow-right-short"></i>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Wire up quick-size clicks within the cards
  const cards = grid.querySelectorAll('.product-card');
  cards.forEach(card => {
    let selectedSize = null;
    const sizeBtns = card.querySelectorAll('.quick-size-btn');
    const submitBtn = card.querySelector('.quick-add-submit-btn');
    const productId = card.getAttribute('data-id');
    
    sizeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        sizeBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        selectedSize = e.target.getAttribute('data-size');
        submitBtn.removeAttribute('disabled');
        submitBtn.innerHTML = `ADD TO CART — SIZE ${selectedSize}`;
      });
    });
    
    submitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!selectedSize) return;
      
      const product = PRODUCTS_DATA.find(p => p.id === productId);
      addToCart(product, selectedSize, 1);
      
      // Reset card selection state
      sizeBtns.forEach(b => b.classList.remove('active'));
      selectedSize = null;
      submitBtn.setAttribute('disabled', 'true');
      submitBtn.innerHTML = 'CHOOSE SIZE FIRST';
    });
  });
}

// --- GLOBAL DELEGATED CLICK HANDLERS (works for both static and dynamic cards) ---
document.addEventListener('click', (e) => {
  // Quick size button
  if (e.target.classList.contains('quick-size-btn')) {
    const card = e.target.closest('.product-card');
    if (!card) return;
    card.querySelectorAll('.quick-size-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const submitBtn = card.querySelector('.quick-add-submit-btn');
    if (submitBtn) {
      const size = e.target.getAttribute('data-size');
      submitBtn.removeAttribute('disabled');
      submitBtn.innerHTML = `ADD TO CART — SIZE ${size}`;
    }
  }

  // Add to cart submit (dynamic style)
  if (e.target.classList.contains('quick-add-submit-btn')) {
    const card = e.target.closest('.product-card');
    if (!card) return;
    const activeSize = card.querySelector('.quick-size-btn.active');
    if (!activeSize) return;
    const productId = card.getAttribute('data-id');
    const size = activeSize.getAttribute('data-size');
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (product) addToCart(product, size, 1);
    card.querySelectorAll('.quick-size-btn').forEach(b => b.classList.remove('active'));
    e.target.setAttribute('disabled', 'true');
    e.target.innerHTML = 'CHOOSE SIZE FIRST';
  }

  // Add to cart button (static fallback style)
  if (e.target.classList.contains('add-to-cart-btn') || e.target.closest('.add-to-cart-btn')) {
    const btn = e.target.classList.contains('add-to-cart-btn') ? e.target : e.target.closest('.add-to-cart-btn');
    const card = btn.closest('.product-card');
    if (!card) return;
    const productId = card.getAttribute('data-id');
    const product = PRODUCTS_DATA.find(p => p.id === productId);
    if (!product) return;
    // Try to use selected size, default to first size
    const activeSize = card.querySelector('.quick-size-btn.active');
    const size = activeSize ? activeSize.getAttribute('data-size') : product.sizes[0];
    addToCart(product, size, 1);
  }
});

// --- CART IMPLEMENTATION ---
function initCartDrawer() {
  const backdrop = document.getElementById('drawer-backdrop');
  const cartDrawer = document.getElementById('cart-drawer');
  const openBtn = document.getElementById('cart-open-btn');
  const closeBtn = document.getElementById('cart-close-btn');
  const enterShopBtn = document.getElementById('enter-shop-btn');
  const heroShopBtn = document.getElementById('hero-shop-btn');
  
  const toggleCart = () => {
    backdrop.classList.toggle('active');
    cartDrawer.classList.toggle('active');
    renderCartItems();
  };
  
  if (openBtn) openBtn.addEventListener('click', toggleCart);
  if (closeBtn) closeBtn.addEventListener('click', toggleCart);
  
  // Backdrops click closes everything
  if (backdrop) {
    backdrop.addEventListener('click', () => {
      backdrop.classList.remove('active');
      cartDrawer.classList.remove('active');
      document.getElementById('checkout-drawer').classList.remove('active');
    });
  }
  
  // Smooth scroll links
  const shopSection = document.getElementById('shop-section');
  if (shopSection) {
    const scroll = (e) => {
      e.preventDefault();
      shopSection.scrollIntoView({ behavior: 'smooth' });
    };
    if (enterShopBtn) enterShopBtn.addEventListener('click', scroll);
    if (heroShopBtn) heroShopBtn.addEventListener('click', scroll);
  }
}

function addToCart(product, size, qty = 1) {
  // Check if identical item (id + size) exists
  const existingItemIndex = state.cart.findIndex(item => item.product.id === product.id && item.size === size);
  
  if (existingItemIndex > -1) {
    state.cart[existingItemIndex].quantity += qty;
  } else {
    state.cart.push({
      product,
      size,
      quantity: qty
    });
  }
  
  saveCartToStorage();
  updateCartCounters();
  renderCartItems();
  showToast('ITEM ADDED', `${product.name} (${size}) is ready to gear.`);
  
  // Auto open cart drawer for premium response feel
  const backdrop = document.getElementById('drawer-backdrop');
  const cartDrawer = document.getElementById('cart-drawer');
  if (backdrop && cartDrawer) {
    backdrop.classList.add('active');
    cartDrawer.classList.add('active');
  }
}

function updateCartCounters() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const counters = document.querySelectorAll('.cart-count');
  counters.forEach(c => {
    c.innerHTML = count;
    c.style.display = count > 0 ? 'flex' : 'none';
  });
}

function renderCartItems() {
  const list = document.getElementById('cart-items-list');
  const emptyMsg = document.getElementById('cart-empty-msg');
  const summaryBlock = document.getElementById('cart-summary-block');
  const trackerFill = document.getElementById('shipping-tracker-fill');
  const trackerMsg = document.getElementById('shipping-tracker-msg');
  
  if (!list) return;
  
  if (state.cart.length === 0) {
    list.style.display = 'none';
    emptyMsg.style.display = 'flex';
    summaryBlock.style.display = 'none';
    
    // Reset tracker
    trackerFill.style.width = '0%';
    trackerMsg.classList.remove('free');
    trackerMsg.innerHTML = `<i class="bi bi-truck"></i> ADD GEAR FOR FREE SHIPPING (THRESHOLD $${FREE_SHIPPING_THRESHOLD.toFixed(2)})`;
    return;
  }
  
  list.style.display = 'flex';
  emptyMsg.style.display = 'none';
  summaryBlock.style.display = 'block';
  
  // Calculate pricing
  const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discount = 0.00; // Can build promo codes easily
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0.00 : 7.99;
  const total = subtotal + shipping - discount;
  
  // Update tracker bar
  const progressPercent = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  trackerFill.style.width = `${progressPercent}%`;
  
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    trackerMsg.classList.add('free');
    trackerMsg.innerHTML = '<i class="bi bi-patch-check-fill"></i> ELIGIBLE FOR FREE WORLDWIDE SHIPPING!';
  } else {
    trackerMsg.classList.remove('free');
    const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
    trackerMsg.innerHTML = `<i class="bi bi-info-circle-fill"></i> ADD <strong style="color: var(--accent-neon); margin: 0 4px;">$${remaining.toFixed(2)}</strong> MORE FOR FREE SHIPPING`;
  }
  
  // Render subtotal rows
  document.getElementById('cart-subtotal').innerHTML = `$${subtotal.toFixed(2)}`;
  document.getElementById('cart-shipping').innerHTML = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
  document.getElementById('cart-total').innerHTML = `$${total.toFixed(2)}`;
  
  // Render individual items
  list.innerHTML = state.cart.map((item, idx) => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.product.image}" alt="${item.product.name}">
      <div class="cart-item-details">
        <div class="cart-item-header">
          <h4 class="cart-item-name">${item.product.name}</h4>
          <button class="cart-item-remove" onclick="removeCartItem(${idx})"><i class="bi bi-trash3"></i></button>
        </div>
        <div class="cart-item-meta">
          Size: <span>${item.size}</span>
        </div>
        <div class="cart-item-bottom">
          <div class="qty-control">
            <button class="qty-btn minus" onclick="changeQty(${idx}, -1)"><i class="bi bi-dash"></i></button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn plus" onclick="changeQty(${idx}, 1)"><i class="bi bi-plus"></i></button>
          </div>
          <span class="cart-item-price">$${(item.product.price * item.quantity).toFixed(2)}</span>
        </div>
      </div>
    </div>
  `).join('');
}

window.changeQty = function(idx, delta) {
  state.cart[idx].quantity += delta;
  if (state.cart[idx].quantity < 1) {
    state.cart.splice(idx, 1);
  }
  saveCartToStorage();
  updateCartCounters();
  renderCartItems();
};

window.removeCartItem = function(idx) {
  const name = state.cart[idx].product.name;
  state.cart.splice(idx, 1);
  saveCartToStorage();
  updateCartCounters();
  renderCartItems();
  showToast('ITEM REMOVED', `${name} removed from your selection.`);
};

// --- PRODUCT DETAILS MODAL ---
function initProductModal() {
  const modal = document.getElementById('details-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflowY = 'auto'; // Re-enable scroll
    });
  }
}

window.openProductModal = function(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;
  
  state.activeProduct = product;
  
  const modal = document.getElementById('details-modal');
  const mainImg = document.getElementById('modal-main-img');
  const cat = document.getElementById('modal-cat');
  const title = document.getElementById('modal-title');
  const price = document.getElementById('modal-price');
  const slogan = document.getElementById('modal-slogan');
  const desc = document.getElementById('modal-desc');
  const sizeList = document.getElementById('modal-sizes-list');
  const specsFabric = document.getElementById('spec-fabric-text');
  const specsFit = document.getElementById('spec-fit-text');
  const specsCare = document.getElementById('spec-care-text');
  const addToCartBtn = document.getElementById('modal-add-to-cart-btn');
  
  // Set basic data
  mainImg.src = product.image;
  cat.innerHTML = product.category;
  title.innerHTML = product.name;
  price.innerHTML = `$${product.price.toFixed(2)}`;
  slogan.innerHTML = product.slogan;
  desc.innerHTML = product.description;
  
  // Set specs
  specsFabric.innerHTML = product.specs.fabric;
  specsFit.innerHTML = product.specs.fit;
  specsCare.innerHTML = product.specs.care;
  
  // Setup sizing
  let selectedSize = null;
  addToCartBtn.setAttribute('disabled', 'true');
  addToCartBtn.innerHTML = 'SELECT A SIZE FIRST';
  
  sizeList.innerHTML = product.sizes.map(size => `
    <div class="size-chip" data-size="${size}">${size}</div>
  `).join('');
  
  const chips = sizeList.querySelectorAll('.size-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      chips.forEach(c => c.classList.remove('active'));
      e.target.classList.add('active');
      selectedSize = e.target.getAttribute('data-size');
      
      addToCartBtn.removeAttribute('disabled');
      addToCartBtn.innerHTML = `ADD GEAR TO CART — SIZE ${selectedSize}`;
    });
  });
  
  // Remove existing event listeners from Add button to prevent multi-firing
  const newAddToCartBtn = addToCartBtn.cloneNode(true);
  addToCartBtn.parentNode.replaceChild(newAddToCartBtn, addToCartBtn);
  
  newAddToCartBtn.addEventListener('click', () => {
    if (!selectedSize) return;
    addToCart(product, selectedSize, 1);
    modal.classList.remove('active');
    document.body.style.overflowY = 'auto';
  });
  
  // Open modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Stop page scroll
  
  // Dynamic accordion reset
  const triggers = document.querySelectorAll('.accordion-trigger');
  triggers.forEach(trigger => {
    trigger.classList.remove('active');
    const content = trigger.nextElementSibling;
    content.style.maxHeight = null;
  });
  
  // Sizing guide button interaction
  const sizeGuideLink = document.getElementById('size-guide-link');
  if (sizeGuideLink) {
    sizeGuideLink.onclick = () => {
      openSizeGuideModal();
    };
  }
}

// Specs Accordion Toggle Functionality
window.toggleAccordion = function(e) {
  const trigger = e.currentTarget;
  trigger.classList.toggle('active');
  const content = trigger.nextElementSibling;
  
  if (content.style.maxHeight) {
    content.style.maxHeight = null;
  } else {
    content.style.maxHeight = content.scrollHeight + "px";
  }
};

// Size Guide Sub-modal Handler
function openSizeGuideModal() {
  const modal = document.getElementById('size-guide-modal');
  if (modal) {
    modal.classList.add('active');
    
    const closeBtn = document.getElementById('size-guide-close');
    closeBtn.onclick = () => {
      modal.classList.remove('active');
    };
  }
}

// --- CONFETTI LAUNCH CHECKOUT IMPLEMENTATION (bKash & Nagad advance delivery payment system) ---
function initCheckout() {
  const cartDrawer = document.getElementById('cart-drawer');
  const checkoutDrawer = document.getElementById('checkout-drawer');
  const triggerBtn = document.getElementById('cart-checkout-btn');
  const closeBtn = document.getElementById('checkout-close-btn');
  const paymentOptions = document.querySelectorAll('.checkout-drawer .payment-option');
  const nextBtn = document.getElementById('checkout-next-btn');
  const regionSelect = document.getElementById('ship-region');
  const copyBtn = document.getElementById('copy-payment-num-btn');
  
  if (triggerBtn) {
    triggerBtn.addEventListener('click', () => {
      cartDrawer.classList.remove('active');
      checkoutDrawer.classList.add('active');
      resetCheckoutForm();
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      checkoutDrawer.classList.remove('active');
      document.getElementById('drawer-backdrop').classList.remove('active');
    });
  }
  
  // Settle Region select updates charges
  if (regionSelect) {
    regionSelect.addEventListener('change', (e) => {
      state.deliveryRegion = e.target.value;
      updateCheckoutTotals();
    });
  }
  
  // Settle Number copy utility
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const numElement = document.getElementById('checkout-payment-num');
      if (numElement) {
        navigator.clipboard.writeText(numElement.innerText.trim());
        showToast('NUMBER COPIED', 'Wallet number 01606590420 copied to clipboard.');
      }
    });
  }
  
  // Step mobile wallet selectors
  paymentOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      paymentOptions.forEach(o => o.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      
      const method = target.getAttribute('data-method');
      state.paymentMethod = method;
      
      // Update label in inputs
      const senderLabel = document.getElementById('sender-number-label');
      if (senderLabel) {
        senderLabel.innerHTML = `Sender ${method === 'bkash' ? 'bKash' : 'Nagad'} Wallet Number`;
      }
      
      const senderInput = document.getElementById('pay-sender');
      if (senderInput) {
        senderInput.placeholder = `01XXXXXXXXX`;
      }
    });
  });
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      progressCheckout();
    });
  }
}

function updateCheckoutTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const isInside = state.deliveryRegion === 'inside';
  const chargeAmount = isInside ? 80 : 150;
  
  // Update totals displays
  document.getElementById('checkout-subtotal-val').innerHTML = `$${subtotal.toFixed(2)}`;
  document.getElementById('checkout-shipping-val').innerHTML = `৳${chargeAmount}.00 BDT`;
  document.getElementById('checkout-total-val').innerHTML = `$${subtotal.toFixed(2)}`; // Subtotal remains COD
  
  // Step 2 badge updates
  const chargeBadge = document.getElementById('checkout-charge-badge');
  if (chargeBadge) {
    chargeBadge.innerHTML = `৳${chargeAmount} BDT`;
  }
}

function resetCheckoutForm() {
  state.checkoutStep = 1;
  state.deliveryRegion = 'inside';
  state.paymentMethod = 'bkash';
  
  document.getElementById('checkout-step-1').style.display = 'block';
  document.getElementById('checkout-step-2').style.display = 'none';
  document.getElementById('checkout-step-3').style.display = 'none';
  
  // Set region dropdown to default
  const regionSelect = document.getElementById('ship-region');
  if (regionSelect) regionSelect.value = 'inside';
  
  // Set wallet selector active
  const paymentOptions = document.querySelectorAll('.checkout-drawer .payment-option');
  paymentOptions.forEach(o => o.classList.remove('active'));
  if (paymentOptions.length > 0) paymentOptions[0].classList.add('active');
  
  // Set label
  const senderLabel = document.getElementById('sender-number-label');
  if (senderLabel) senderLabel.innerHTML = 'Sender bKash Wallet Number';
  
  // Set indicators
  const indicators = document.querySelectorAll('.checkout-steps .step-indicator');
  indicators.forEach(i => i.classList.remove('active'));
  indicators[0].classList.add('active');
  
  // Reset input fields
  document.querySelectorAll('.checkout-drawer .form-input').forEach(input => input.value = '');
  document.getElementById('checkout-next-btn').style.display = 'block';
  document.getElementById('checkout-next-btn').innerHTML = 'CONTINUE TO PAYMENT';
  
  updateCheckoutTotals();
}

function progressCheckout() {
  const steps = document.querySelectorAll('.checkout-steps .step-indicator');
  
  if (state.checkoutStep === 1) {
    // Validate Shipping Form
    const name = document.getElementById('ship-name').value.trim();
    const email = document.getElementById('ship-email').value.trim();
    const address = document.getElementById('ship-address').value.trim();
    const city = document.getElementById('ship-city').value.trim();
    
    if (!name || !email || !address || !city) {
      showToast('VALIDATION FAILED', 'Please fill out all required shipping fields.');
      return;
    }
    
    state.checkoutStep = 2;
    document.getElementById('checkout-step-1').style.display = 'none';
    document.getElementById('checkout-step-2').style.display = 'block';
    steps[1].classList.add('active');
    
    document.getElementById('checkout-next-btn').innerHTML = 'CONFIRM TRANSACTION DEPOSIT';
  } else if (state.checkoutStep === 2) {
    // Validate Transaction Inputs
    const senderNum = document.getElementById('pay-sender').value.trim();
    const txnId = document.getElementById('pay-txnid').value.trim();
    
    // Validate BD mobile number (11 digits starting with 01)
    const mobileRegex = /^01[3-9]\d{8}$/;
    if (!mobileRegex.test(senderNum)) {
      showToast('INVALID NUMBER', `Please enter a valid 11-digit Sender ${state.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Number starting with 01.`);
      return;
    }
    
    // Validate TxnID (at least 8 chars)
    if (txnId.length < 8) {
      showToast('INVALID TRANSACTION ID', 'Please enter a valid Transaction ID (TxnID) copied from your payment confirmation.');
      return;
    }
    
    // Collect order data for email notification
    const orderData = {
      name: document.getElementById('ship-name').value.trim(),
      email: document.getElementById('ship-email').value.trim(),
      address: document.getElementById('ship-address').value.trim(),
      city: document.getElementById('ship-city').value.trim(),
      zip: document.getElementById('ship-zip').value.trim(),
      region: state.deliveryRegion === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka',
      paymentMethod: state.paymentMethod === 'bkash' ? 'bKash' : 'Nagad',
      senderNumber: senderNum,
      txnId: txnId,
      items: [...state.cart],
      total: (state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)).toFixed(2)
    };
    
    // Send email notification
    sendOrderEmail(orderData);
    
    // Success State!
    state.checkoutStep = 3;
    document.getElementById('checkout-step-2').style.display = 'none';
    document.getElementById('checkout-step-3').style.display = 'flex';
    steps[2].classList.add('active');
    document.getElementById('checkout-next-btn').style.display = 'none';
    
    // Launch Confetti Celebration!
    if (window.fitzieConfetti) {
      window.fitzieConfetti.start(4500);
    }
    
    // Clear Cart State
    state.cart = [];
    saveCartToStorage();
    updateCartCounters();
    
    showToast('ORDER BOOKED', 'Delivery deposit received. Verifying transaction...');
  }
}

// --- SIZE QUIZ SYSTEM ---
function initQuiz() {
  const quizTrigger = document.getElementById('quiz-trigger-btn');
  const quizModal = document.getElementById('quiz-modal');
  const quizClose = document.getElementById('quiz-close-btn');
  
  if (quizTrigger && quizModal) {
    quizTrigger.addEventListener('click', () => {
      quizModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      resetQuiz();
    });
  }
  
  if (quizClose && quizModal) {
    quizClose.addEventListener('click', () => {
      quizModal.classList.remove('active');
      document.body.style.overflowY = 'auto';
    });
  }
  
  // Range sliders values binds
  const heightSlider = document.getElementById('quiz-height-range');
  const heightVal = document.getElementById('quiz-height-val');
  if (heightSlider && heightVal) {
    heightSlider.addEventListener('input', (e) => {
      heightVal.innerHTML = e.target.value;
      state.quizData.height = parseInt(e.target.value);
    });
  }
  
  const weightSlider = document.getElementById('quiz-weight-range');
  const weightVal = document.getElementById('quiz-weight-val');
  if (weightSlider && weightVal) {
    weightSlider.addEventListener('input', (e) => {
      weightVal.innerHTML = e.target.value;
      state.quizData.weight = parseInt(e.target.value);
    });
  }
  
  // Option selectors in Step 3
  const optCards = document.querySelectorAll('.quiz-option-card');
  optCards.forEach(card => {
    card.addEventListener('click', (e) => {
      optCards.forEach(c => c.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      state.quizData.fit = target.getAttribute('data-fit');
    });
  });
  
  // Nav buttons binds
  const btnNext1 = document.getElementById('quiz-next-1');
  const btnNext2 = document.getElementById('quiz-next-2');
  const btnBack2 = document.getElementById('quiz-back-2');
  const btnNext3 = document.getElementById('quiz-next-3');
  const btnBack3 = document.getElementById('quiz-back-3');
  
  if (btnNext1) btnNext1.addEventListener('click', () => changeQuizStep(2));
  if (btnNext2) btnNext2.addEventListener('click', () => changeQuizStep(3));
  if (btnBack2) btnBack2.addEventListener('click', () => changeQuizStep(1));
  if (btnBack3) btnBack3.addEventListener('click', () => changeQuizStep(2));
  if (btnNext3) btnNext3.addEventListener('click', () => processQuizResult());
}

function resetQuiz() {
  state.quizStep = 1;
  state.quizData = { height: 175, weight: 70, fit: 'regular' };
  
  // Reset elements
  document.getElementById('quiz-height-range').value = 175;
  document.getElementById('quiz-height-val').innerHTML = 175;
  document.getElementById('quiz-weight-range').value = 70;
  document.getElementById('quiz-weight-val').innerHTML = 70;
  
  document.querySelectorAll('.quiz-option-card').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.quiz-option-card')[0].classList.add('active'); // Default Regular
  
  showQuizStep(1);
}

function changeQuizStep(step) {
  state.quizStep = step;
  showQuizStep(step);
}

function showQuizStep(step) {
  // Update step panes
  document.querySelectorAll('.quiz-step-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`quiz-step-${step}`).classList.add('active');
  
  // Update indicators dots
  const dots = document.querySelectorAll('.quiz-step-dots .quiz-dot');
  dots.forEach(d => d.classList.remove('active'));
  
  // Step 4 shows the result badge
  if (step <= 3) {
    dots[step - 1].classList.add('active');
  }
}

function processQuizResult() {
  changeQuizStep(4);
  
  const h = state.quizData.height;
  const w = state.quizData.weight;
  const fit = state.quizData.fit;
  
  // Intelligence size algorithm
  let baseSize = 'M';
  
  if (h < 165) {
    if (w < 55) baseSize = 'S';
    else if (w < 68) baseSize = 'M';
    else baseSize = 'L';
  } else if (h <= 178) {
    if (w < 60) baseSize = 'S';
    else if (w < 74) baseSize = 'M';
    else if (w < 86) baseSize = 'L';
    else baseSize = 'XL';
  } else if (h <= 188) {
    if (w < 68) baseSize = 'M';
    else if (w < 82) baseSize = 'L';
    else if (w < 95) baseSize = 'XL';
    else baseSize = 'XXL';
  } else {
    if (w < 78) baseSize = 'L';
    else if (w < 92) baseSize = 'XL';
    else baseSize = 'XXL';
  }
  
  // Sizing adjustments based on fit preferences
  let finalSize = baseSize;
  const sizesArr = ['S', 'M', 'L', 'XL', 'XXL'];
  const currentIndex = sizesArr.indexOf(baseSize);
  
  if (fit === 'tight') {
    // If snug, go down a size if possible
    if (currentIndex > 0) finalSize = sizesArr[currentIndex - 1];
  } else if (fit === 'oversized') {
    // If relaxed slouchy fit, go up a size if possible
    if (currentIndex < sizesArr.length - 1) finalSize = sizesArr[currentIndex + 1];
  }
  
  // Display result
  document.getElementById('quiz-result-badge').innerHTML = finalSize;
  
  const fitLabels = {
    tight: 'snug compression',
    regular: 'athletic regular',
    oversized: 'oversized slouchy'
  };
  
  document.getElementById('quiz-result-explanation').innerHTML = `
    Based on your height of <strong>${h}cm</strong>, weight of <strong>${w}kg</strong>, and a preference for <strong>${fitLabels[fit]}</strong> fit, we recommend this gear in size ${finalSize}.
  `;
}

// --- NEWSLETTER INTEGRATION ---
function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('.newsletter-input');
      const email = input.value.trim();
      
      if (!email) return;
      
      showToast('SUBSCRIBED', 'Welcome to the Fitzie movement. Stay Evolving.');
      input.value = '';
    });
  }
}

// --- TOAST NOTIFICATIONS ---
window.showToast = function(title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-icon"><i class="bi bi-patch-check-fill"></i></div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Fade out and remove toast after 3.5s
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 400);
  }, 3500);
};
