// All enhancements are additive. They work via DOM hooks and do not modify app.js.
// Adds: localStorage cart persistence, add-to-cart animation, ratings/badges,
// mobile filter drawer, remove/undo toasts, empty-cart illustration,
// nicer confirm modal, and Paystack test checkout.

const ready = fn => (document.readyState !== 'loading') ? fn() : document.addEventListener('DOMContentLoaded', fn);

ready(() => {
  const grid = document.getElementById('grid');
  const cartList = document.getElementById('cartList');
  const cartCountHdr = document.getElementById('cartCountHdr');
  const orderTotal = document.getElementById('orderTotal');
  const confirmBtn = document.getElementById('confirmBtn');
  const modal = document.getElementById('modal');
  const modalTotal = document.getElementById('modalTotal');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortSelect = document.getElementById('sortSelect');
  const toast = document.getElementById('toast');

  // Lightweight toast (independent)
  function showToast2(message='Done') {
    if (!toast) return;
    toast.innerHTML = `<div class="max-w-md w-full rounded-xl bg-rose900 text-white px-4 py-3 shadow-soft"><p class="text-sm">${message}</p></div>`;
    toast.classList.remove('hidden','opacity-0'); toast.classList.add('flex');
    clearTimeout(showToast2._t);
    showToast2._t = setTimeout(()=>{
      toast.classList.add('opacity-0');
      setTimeout(()=>{ toast.classList.add('hidden'); toast.classList.remove('flex','opacity-0'); toast.innerHTML=''; }, 250);
    }, 1800);
  }

  // Local copy for ratings/badges mapping
  const PRODUCTS_BY_NAME = new Map([
    ['Waffle with Berries', { rating: 4.7, badge: 'Best-seller' }],
    ['Vanilla Bean Crème Brûlée', { rating: 4.8, badge: 'Chef’s pick' }],
    ['Macaron Mix of Five', { rating: 4.5 }],
    ['Classic Tiramisu', { rating: 4.6 }],
    ['Pistachio Baklava', { rating: 4.4 }],
    ['Lemon Meringue Pie', { rating: 4.5, badge: 'New' }],
    ['Red Velvet Cake', { rating: 4.6 }],
    ['Salted Caramel Brownie', { rating: 4.7 }],
    ['Vanilla Panna Cotta', { rating: 4.5 }]
  ]);

  // Helpers to interact with cards via DOM only
  function findCardByName(name){
    return Array.from(grid.querySelectorAll('article')).find(a => a.querySelector('h3')?.textContent.trim() === name);
  }
  function setQtyByClicks(name, qty){
    const card = findCardByName(name);
    if (!card) return;
    const addBtn = card.querySelector('.addBtn');
    const inc = card.querySelector('.inc');
    const dec = card.querySelector('.dec');
    const qtyEl = card.querySelector('.qty');
    let current = parseInt(qtyEl?.textContent || '0', 10) || 0;
    while (current > 0 && dec) { dec.click(); current--; }
    if (qty > 0 && addBtn) { addBtn.click(); current = 1; }
    while (current < qty && inc) { inc.click(); current++; }
  }

  // Fly-to-cart animation
  function flyToCart(imgEl){
    const targetRect = (cartCountHdr || orderTotal).getBoundingClientRect();
    const rect = imgEl.getBoundingClientRect();
    const ghost = imgEl.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = rect.left + 'px';
    ghost.style.top = rect.top + 'px';
    ghost.style.width = rect.width + 'px';
    ghost.style.height = rect.height + 'px';
    ghost.style.borderRadius = '12px';
    ghost.style.zIndex = '9999';
    ghost.style.transition = 'transform 600ms cubic-bezier(.2,.7,.2,1), opacity 600ms';
    document.body.appendChild(ghost);
    const dx = targetRect.left - rect.left;
    const dy = targetRect.top - rect.top;
    requestAnimationFrame(()=>{
      ghost.style.transform = `translate(${dx}px, ${dy}px) scale(.1)`;
      ghost.style.opacity = '0.2';
    });
    setTimeout(()=> ghost.remove(), 650);
  }
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.addBtn, .inc');
    if (!btn) return;
    const card = btn.closest('article');
    const img = card?.querySelector('img');
    if (img) flyToCart(img);
  });

  // Ratings & badges (decorate cards after render)
  function decorateCards(){
    grid.querySelectorAll('article').forEach(card => {
      if (card.dataset.enhanced) return;
      const name = card.querySelector('h3')?.textContent.trim();
      const meta = PRODUCTS_BY_NAME.get(name);
      const header = card.querySelector('.p-5');
      if (meta && header){
        if (meta.badge){
          const b = document.createElement('span');
          b.className = 'inline-block text-[11px] ml-2 px-2 py-0.5 rounded-full bg-rose100 text-rose900 align-middle';
          b.textContent = meta.badge;
          header.querySelector('p')?.appendChild(b);
        }
        if (meta.rating){
          const r = document.createElement('div');
          r.className = 'mt-2 flex items-center gap-1';
          const full = Math.floor(meta.rating);
          const half = meta.rating - full >= 0.5;
          const stars = Array.from({length:5}, (_,i)=> i<full ? '★' : (i===full && half ? '☆' : '☆')).join('');
          r.innerHTML = `<span aria-label="Rating ${meta.rating}">${stars}</span><span class="text-rose500 text-sm ml-1">${meta.rating.toFixed(1)}</span>`;
          header.appendChild(r);
        }
      }
      card.dataset.enhanced = '1';
    });
  }
  const gridObserver = new MutationObserver(() => decorateCards());
  gridObserver.observe(grid, { childList: true, subtree: true });
  decorateCards();

  // Cart persistence via DOM (no access to app.js state)
  const LS_KEY = 'dd_cart_items_v1';
  function serializeCartFromDOM(){
    const items = [];
    cartList.querySelectorAll('div').forEach(row => {
      const span = row.querySelector('span');
      if (!span) return;
      const text = span.textContent.trim();
      const m = text.match(/^(.*)\sx(\d+)$/);
      if (m) items.push({ name: m[1].trim(), qty: parseInt(m[2],10) });
    });
    return items;
  }
  function persistCart(){ localStorage.setItem(LS_KEY, JSON.stringify(serializeCartFromDOM())); }
  const cartObserver = new MutationObserver(() => {
    // add remove buttons
    cartList.querySelectorAll('div').forEach(row => {
      if (row.querySelector('.dd-remove')) return;
      const nameText = row.querySelector('span')?.textContent?.replace(/\sx\d+$/, '').trim();
      const price = row.querySelectorAll('span')[1];
      const removeBtn = document.createElement('button');
      removeBtn.className = 'dd-remove text-xs text-rose500 hover:text-rose900 underline';
      removeBtn.type = 'button';
      removeBtn.textContent = 'remove';
      removeBtn.addEventListener('click', () => {
        const qtyMatch = row.querySelector('span')?.textContent.match(/x(\d+)/);
        const prevQty = qtyMatch ? parseInt(qtyMatch[1],10) : 1;
        setQtyByClicks(nameText, 0);
        showToast2('Removed from cart');
        makeUndo(() => setQtyByClicks(nameText, prevQty));
      });
      if (price) {
        const holder = document.createElement('div');
        holder.className = 'flex items-center gap-3';
        price.after(holder);
        holder.appendChild(removeBtn);
      }
    });
    // empty-cart illustration
    if (!cartList.childElementCount){
      const empty = document.createElement('div');
      empty.className = 'text-center text-rose500 py-6';
      empty.innerHTML = '<div class="text-5xl">🧁</div><p>Your cart is empty</p>';
      cartList.appendChild(empty);
    }
    persistCart();
  });
  cartObserver.observe(cartList, { childList: true, subtree: true });
  ['click','input','change'].forEach(ev => document.addEventListener(ev, persistCart, true));

  // Restore saved cart by simulating clicks on cards
  const saved = localStorage.getItem(LS_KEY);
  if (saved){
    try {
      const items = JSON.parse(saved);
      setTimeout(()=>{ items.forEach(it => setQtyByClicks(it.name, it.qty)); }, 50);
    } catch {}
  }

  // Undo toast
  function makeUndo(onRestore){
    if (!toast) return;
    toast.innerHTML = `<div class="max-w-md w-full rounded-xl bg-rose900 text-white px-4 py-3 shadow-soft flex items-center justify-between gap-3"><p class="text-sm">Item removed.</p><button class="px-3 py-1 rounded bg-white/15 hover:bg-white/25 text-sm" id="dd-undo">Undo</button></div>`;
    toast.classList.remove('hidden','opacity-0'); toast.classList.add('flex');
    const b = toast.querySelector('#dd-undo');
    const done = () => { toast.classList.add('opacity-0'); setTimeout(()=>{ toast.classList.add('hidden'); toast.classList.remove('flex','opacity-0'); toast.innerHTML=''; }, 250); };
    const t = setTimeout(done, 3500);
    b.addEventListener('click', () => { clearTimeout(t); onRestore?.(); done(); });
  }

  // Enhance confirm modal + confetti + Paystack checkout
  function confetti(){
    const bits = ['🎉','🎊','✨','🧁'];
    for (let i=0;i<24;i++){
      const s = document.createElement('div');
      s.textContent = bits[i%bits.length];
      s.style.position='fixed'; s.style.left = Math.random()*100+'%'; s.style.top='-20px'; s.style.fontSize = (16+Math.random()*16)+'px';
      s.style.transition = 'transform 1200ms linear, opacity 1200ms'; s.style.zIndex='9999';
      document.body.appendChild(s);
      const dx = (Math.random()*2-1)*200; const dy = window.innerHeight + 40;
      requestAnimationFrame(()=>{ s.style.transform = `translate(${dx}px, ${dy}px)`; s.style.opacity='0'; });
      setTimeout(()=> s.remove(), 1300);
    }
  }
  confirmBtn?.addEventListener('click', () => { setTimeout(confetti, 100); });

  function enhanceModal(){
    if (modal.dataset.ddEnhanced) return;
    const modalBox = modal.querySelector('.relative.max-w-md');
    if (!modalBox) return;
    const firstH3 = modalBox.querySelector('h3');
    const firstP = firstH3?.nextElementSibling;
    const headerWrap = document.createElement('div');
    headerWrap.className = 'flex items-center gap-3';
    headerWrap.innerHTML = '<div class="w-10 h-10 rounded-full bg-green grid place-content-center">✅</div><div><h3 class="text-xl font-bold">Order Confirmed</h3><p class="text-rose500 text-sm">We hope you enjoy your food!</p></div>';
    if (firstH3) firstH3.remove(); if (firstP) firstP.remove();
    modalBox.insertBefore(headerWrap, modalBox.firstChild);

    const checkoutBtn = document.createElement('button');
    checkoutBtn.id = 'dd-checkout';
    checkoutBtn.className = 'mt-3 w-full py-3 rounded-full bg-rust text-white font-semibold hover:bg-rustdark focus:outline-none focus:ring-2 focus:ring-offset-2';
    checkoutBtn.textContent = 'Checkout (Paystack Test)';
    modalBox.appendChild(checkoutBtn);
    checkoutBtn.addEventListener('click', () => startPaystack());

    modal.dataset.ddEnhanced = '1';
  }
  enhanceModal();

  // Mobile filter drawer (clones controls and syncs)
  function initDrawer(){
    if (document.getElementById('dd-drawer')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sm:hidden mb-3 px-4 py-2 rounded-full border bg-white shadow-soft';
    btn.textContent = 'Filters';
    grid.parentElement.insertBefore(btn, grid.parentElement.firstChild);

    const drawer = document.createElement('div');
    drawer.id = 'dd-drawer';
    drawer.className = 'fixed inset-0 hidden';
    drawer.innerHTML = `
      <div class="absolute inset-0 bg-black/40" data-close></div>
      <div class="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-4 shadow-xl">
        <div class="h-1 w-12 rounded-full bg-rose100 mx-auto mb-3"></div>
        <div class="grid gap-3">
          <input id="dd-search" type="search" placeholder="Search desserts…" class="w-full rounded-full border bg-white px-4 py-2 shadow-soft" />
          <select id="dd-category" class="w-full rounded-full border bg-white px-4 py-2 shadow-soft"></select>
          <select id="dd-sort" class="w-full rounded-full border bg-white px-4 py-2 shadow-soft">
            <option value="popular">Most popular</option>
            <option value="priceAsc">Price: Low → High</option>
            <option value="priceDesc">Price: High → Low</option>
            <option value="nameAsc">Name: A → Z</option>
            <option value="nameDesc">Name: Z → A</option>
          </select>
          <button data-close class="mt-2 w-full py-2 rounded-full bg-rust text-white">Apply</button>
        </div>
      </div>`;
    document.body.appendChild(drawer);

    const syncToMain = () => {
      const ds = drawer.querySelector('#dd-search');
      const dc = drawer.querySelector('#dd-category');
      const dd = drawer.querySelector('#dd-sort');
      if (searchInput) { searchInput.value = ds.value; searchInput.dispatchEvent(new Event('input', {bubbles:true})); }
      if (categoryFilter) { categoryFilter.value = dc.value; categoryFilter.dispatchEvent(new Event('change', {bubbles:true})); }
      if (sortSelect) { sortSelect.value = dd.value; sortSelect.dispatchEvent(new Event('change', {bubbles:true})); }
    };

    btn.addEventListener('click', ()=> drawer.classList.remove('hidden'));
    drawer.addEventListener('click', e => { if (e.target.hasAttribute('data-close')) { syncToMain(); drawer.classList.add('hidden'); }});

    const repopulate = () => {
      const ddCat = drawer.querySelector('#dd-category');
      ddCat.innerHTML = '';
      categoryFilter?.querySelectorAll('option')?.forEach(opt => {
        const o = opt.cloneNode(true); ddCat.appendChild(o);
      });
      drawer.querySelector('#dd-search').value = searchInput?.value || '';
      drawer.querySelector('#dd-sort').value = sortSelect?.value || 'popular';
    };
    const catObs = new MutationObserver(repopulate);
    catObs.observe(categoryFilter, { childList: true });
    repopulate();
  }
  initDrawer();

  // Paystack (test mode)
  function loadPaystack(){
    return new Promise((res, rej) => {
      if (window.PaystackPop) return res();
      const s = document.createElement('script');
      s.src = 'https://js.paystack.co/v1/inline.js';
      s.onload = () => res();
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function parseTotal(){
    const txt = (modalTotal?.textContent || orderTotal?.textContent || '$0.00').replace(/[^\d.]/g,'');
    return Math.round(parseFloat(txt||'0') * 100); // NGN kobo
  }
  async function startPaystack(){
    try {
      await loadPaystack();
      const amount = parseTotal();
      if (!amount) return showToast2('Cart is empty');
      const ref = 'DD-'+Date.now();
      const handler = window.PaystackPop.setup({
        key: 'pk_test_xxxxxxxx', // replace with your own public key
        email: 'test@example.com',
        amount: amount,
        currency: 'NGN',
        ref,
        callback: function(){ showToast2('Payment complete: '+ref); },
        onClose: function(){ showToast2('Payment window closed'); }
      });
      handler.openIframe();
    } catch(err){
      console.error(err);
      showToast2('Unable to load Paystack');
    }
  }
});
