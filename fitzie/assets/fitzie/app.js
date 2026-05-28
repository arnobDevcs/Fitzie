/**
 * Fitzie Web Store - Core Application Logic
 * Pure ES6 Vanilla Javascript for state management and interactive features.
 */

// --- PRODUCT DATA SCHEMA ---
const PRODUCTS_DATA = [
  {
    id: 'compression-pulse',
    name: 'Pulse Neo Compression Shirt',
    category: 'compression',
    price: 39.00,
    image: 'assets/fitzie_compression.png',
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.9,
    reviews: 124,
    slogan: 'Engineered for maximum muscle responsiveness and tactical thermal control.',
    description: 'The Pulse Neo Compression Shirt integrates high-stretch compression fibers with heat-mapping panels to support heavy lifts and athletic runs. Featuring high-vis neon flatlock stitching and our iconic fitzie branding on the chest, it combines combat-ready utility with a modern activewear silhouette.',
    specs: {
      fabric: '88% Technical Recycled Polyester, 12% Spandex core weave.',
      fit: 'Skin-tight compression. Fits like a second skin for muscle warm-up.',
      care: 'Machine wash cold inside out, air dry only. Do not iron print.'
    }
  },
  {
    id: 'jogger-tactical',
    name: 'Stealth Ripstop Cargo Joggers',
    category: 'bottoms',
    price: 54.00,
    image: 'assets/fitzie_jogger.png',
    sizes: ['M', 'L', 'XL', 'XXL'],
    rating: 4.8,
    reviews: 187,
    slogan: 'Weather-resistant ripped cargo aesthetics for active movement.',
    description: 'Designed for tactical everyday wear and heavy training, our Stealth Ripstop Joggers are cut from rugged stretch nylon fabric. Designed with modular storage straps, glowing neon zip cords, and tapered ankle cuffs, these trousers provide flexibility and streetwear flair in any environment.',
    specs: {
      fabric: '92% Heavy-Duty Ripstop Nylon, 8% Elastane for 4-way stretch.',
      fit: 'Relaxed in the thigh, sharply tapered from the knee down.',
      care: 'Machine wash warm, tumble dry low. Do not bleach.'
    }
  },
  {
    id: 'hoodie-void',
    name: 'Void Heavy Double-Fleece Hoodie',
    category: 'hoodies',
    price: 68.00,
    image: 'assets/fitzie_hoodie.png',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    rating: 5.0,
    reviews: 340,
    slogan: 'Double-brushed heavyweight warmth for maximum structural drape.',
    description: 'Crafted from premium 450 GSM organic French terry cotton, the Void Hoodie is our flagship comfort piece. Engineered with dropped shoulders for a relaxed slouchy fit, double-lined hood, and high-density fitzie neon embroidery, it retains its structure and plush softness wash after wash.',
    specs: {
      fabric: '100% Organic Cotton French Terry, 450 GSM heavy weight.',
      fit: 'Oversized drop-shoulder block. We recommend ordering true to size.',
      care: 'Wash cold, wash inside out with similar colors. Dry flat.'
    }
  },
  {
    id: 'bag-drift',
    name: 'Drift Tech Chest Utility Pack',
    category: 'accessories',
    price: 45.00,
    image: 'assets/fitzie_bag.png',
    sizes: ['OS'],
    rating: 4.7,
    reviews: 89,
    slogan: 'Modular quick-release chest chest rig for gym and urban travel.',
    description: 'The Drift Tech Utility Pack sits securely across the chest or shoulder, keeping your phone, cards, and everyday items safe. Made of ultra-tough water-resistant Cordura, it features neon utility stitching, tactical loop straps, and military-grade quick-snap magnetic buckles.',
    specs: {
      fabric: '1000D Ballistic Cordura Nylon, YKK splash-proof zippers.',
      fit: 'Fully adjustable nylon webbing straps. Fits all body frames.',
      care: 'Spot clean only with warm water and soft damp cloth.'
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

    enterBtn.addEventListener('click', () => {
      overlay.classList.add('hidden');
      
      // Allow visual fade-out/scale-warp animation to complete before restoring scroll
      setTimeout(() => {
        document.body.style.overflowY = 'auto';
        overlay.style.display = 'none'; // Unmount to free GPU/CPU memory
      }, 900);
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
