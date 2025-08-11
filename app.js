/* =========================
   DOM
========================= */
const grid = document.getElementById("grid");
const cartList = document.getElementById("cartList");
const cartCountHdr = document.getElementById("cartCountHdr");
const orderTotal = document.getElementById("orderTotal");
const confirmBtn = document.getElementById("confirmBtn");
const modal = document.getElementById("modal");
const modalItems = document.getElementById("modalItems");
const modalTotal = document.getElementById("modalTotal");
const newOrderBtn = document.getElementById("newOrderBtn");

/* Filters + toast */
const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearSearch");
const categoryFilter = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");
const categoryChips = document.getElementById("categoryChips");
const toast = document.getElementById("toast");

/* =========================
   DATA
========================= */
const products = [
  { id: 1, title: "Waffle with Berries", price: 6.5, image: "https://images.unsplash.com/photo-1639107981824-4904e9aa6e7e?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0", category: "Waffle", description: "Crisp waffle topped with fresh strawberries and cream.", rating: 4.7, badge: "Best-seller" },
  { id: 2, title: "Vanilla Bean Crème Brûlée", price: 7.0, image: "https://images.unsplash.com/photo-1594233792208-4365e2907605?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", category: "Crème Brûlée", description: "Silky custard with a caramelized sugar crust.", rating: 4.8, badge: "Chef’s pick" },
  { id: 3, title: "Macaron Mix of Five", price: 8.0, image: "https://images.unsplash.com/photo-1556910103-587eed540238?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", category: "Macaron", description: "Assorted delicate macarons in five flavors.", rating: 4.5 },
  { id: 4, title: "Classic Tiramisu", price: 5.5, image: "https://plus.unsplash.com/premium_photo-1661266861006-2b26096c3d89?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", category: "Tiramisu", description: "Espresso-soaked ladyfingers with mascarpone.", rating: 4.6 },
  { id: 5, title: "Pistachio Baklava", price: 4.0, image: "https://plus.unsplash.com/premium_photo-1668618295648-67d762aa7ccd?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", category: "Baklava", description: "Flaky layers with pistachios and honey syrup.", rating: 4.4 },
  { id: 6, title: "Lemon Meringue Pie", price: 5.0, image: "https://ichef.bbci.co.uk/food/ic/food_16x9_1600/recipes/marys_lemon_meringue_pie_02330_16x9.jpg", category: "Pie", description: "Tangy lemon curd with toasted meringue.", rating: 4.5, badge: "New" },
  { id: 7, title: "Red Velvet Cake", price: 4.5, image: "https://i.ytimg.com/vi/KvlAjbfv20M/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDxiEnMizIFYPF86M1XralpqLWyQA", category: "Cake", description: "Moist red velvet with cream cheese frosting.", rating: 4.6 },
  { id: 8, title: "Salted Caramel Brownie", price: 5.5, image: "https://cookingwithawallflower.com/wp-content/uploads/2019/03/Salted-Caramel-Brownies-1.jpg", category: "Brownie", description: "Fudgy brownie swirled with salted caramel.", rating: 4.7 },
  { id: 9, title: "Vanilla Panna Cotta", price: 6.5, image: "https://ichef.bbci.co.uk/food/ic/food_16x9_1600/recipes/vanillapannacotta_87907_16x9.jpg", category: "Panna Cotta", description: "Silky vanilla panna cotta with berries.", rating: 4.5 }
];

/* =========================
   STATE & HELPERS
========================= */
let cart = [];
let index = [];          // [{ el, name, category, price, text }]
let categories = new Set();
let emptyStateEl;

const fmt = n => `$${n.toFixed(2)}`;
const totalItems = () => cart.reduce((s, i) => s + i.qty, 0);
const findInCart = id => cart.find(i => i.id === id);
const debounce = (fn, ms=150) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };

function showToast(message='Done') {
  if (!toast) return;
  // build simple bubble so it also works with your empty #toast container
  toast.innerHTML = `<div class="max-w-md w-full rounded-xl bg-rose900 text-white px-4 py-3 shadow-soft"><p class="text-sm">${message}</p></div>`;
  toast.classList.remove('hidden', 'opacity-0');
  toast.classList.add('flex');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.add('opacity-0');
    setTimeout(() => {
      toast.classList.add('hidden');
      toast.classList.remove('flex', 'opacity-0');
      toast.innerHTML = '';
    }, 250);
  }, 1800);
}

/* =========================
   CART LOGIC
========================= */
function addToCart(product) {
  const item = findInCart(product.id);
  if (item) item.qty += 1;
  else cart.push({ ...product, qty: 1 });
  updateCart();
}

function decreaseQty(id) {
  const item = findInCart(id);
  if (!item) return;
  item.qty -= 1;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  updateCart();
}

function getQty(id) {
  const item = findInCart(id);
  return item ? item.qty : 0;
}

/* =========================
   SORTING + APPLY LIST
========================= */
function applyList(list) {
  const q = (searchInput?.value || "").toLowerCase().trim();
  const cat = categoryFilter?.value || "";
  const sortVal = sortSelect?.value || "popular";

  let out = list.filter(p => {
    const text = `${p.title} ${p.category} ${p.description}`.toLowerCase();
    const matchText = !q || text.includes(q);
    const matchCat  = !cat || p.category === cat;
    return matchText && matchCat;
  });

  if (sortVal === "priceAsc") out.sort((a,b)=>a.price-b.price);
  else if (sortVal === "priceDesc") out.sort((a,b)=>b.price-a.price);
  else if (sortVal === "nameAsc") out.sort((a,b)=>a.title.localeCompare(b.title));
  else if (sortVal === "nameDesc") out.sort((a,b)=>b.title.localeCompare(a.title));
  // 'popular' keeps original order

  return out;
}

/* =========================
   RENDER PRODUCTS (via template)
========================= */
function renderProducts(list) {
  grid.innerHTML = ""; // clear
  const tpl = document.getElementById("cardTpl");

  const data = applyList(list);

  if (data.length === 0) {
    const d = document.createElement('div');
    d.className = 'col-span-full rounded-2xl border bg-white p-8 text-center text-rose500';
    d.innerHTML = `<p class="font-semibold text-rose900 mb-1">No matches found</p>
                   <p>Try a different search or clear filters.</p>`;
    grid.appendChild(d);
    return;
  }

  data.forEach(prod => {
    const frag = tpl.content.cloneNode(true);
    const card = frag.querySelector("article");

    // Data attributes for filtering/index
    card.dataset.id = prod.id;
    card.dataset.name = prod.title;
    card.dataset.category = prod.category;
    card.dataset.price = String(prod.price);

    // Elements
    const img = frag.querySelector("img");
    const catEl = frag.querySelector(".p-5 p.text-xs, .p-5 p.uppercase") || frag.querySelector(".p-5 p");
    const nameEl = frag.querySelector("h3");
    const allPs = frag.querySelectorAll(".p-5 p");
    const priceEl = allPs[1] || allPs[0];

    const addBtn = frag.querySelector(".addBtn");
    const qtyBar = frag.querySelector(".qtyBar");
    const incBtn = frag.querySelector(".inc");
    const decBtn = frag.querySelector(".dec");
    const qtyText = frag.querySelector(".qty");

    // Content
    img.src = prod.image; img.loading = "lazy"; img.decoding = "async";
    img.alt = prod.title;
    if (catEl) catEl.textContent = prod.category;
    if (nameEl) nameEl.textContent = prod.title;
    if (priceEl) priceEl.textContent = fmt(prod.price);

    function syncCard() {
      const q = getQty(prod.id);
      qtyText.textContent = q;
      if (q > 0) {
        addBtn.classList.add("hidden");
        qtyBar.classList.remove("hidden");
        card.classList.add("ring-2", "ring-rust");
      } else {
        qtyBar.classList.add("hidden");
        addBtn.classList.remove("hidden");
        card.classList.remove("ring-2", "ring-rust");
      }
    }

    addBtn.addEventListener("click", () => { addToCart(prod); syncCard(); showToast("Added to cart"); });
    incBtn.addEventListener("click", () => { addToCart(prod); syncCard(); });
    decBtn.addEventListener("click", () => { decreaseQty(prod.id); syncCard(); });

    syncCard();
    grid.appendChild(frag);
  });

  // after (re)render, rebuild index for search filter
  rebuildIndex();
}

/* =========================
   CART UI
========================= */
function updateCart() {
  cartList.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.qty * item.price;
    const row = document.createElement("div");
    row.className = "flex justify-between items-center py-2";
    row.innerHTML = `
      <span class="text-rose900">${item.title} <span class="text-rose500">x${item.qty}</span></span>
      <span class="font-semibold">${fmt(item.qty * item.price)}</span>
    `;
    cartList.appendChild(row);
  });

  orderTotal.textContent = fmt(total);
  cartCountHdr.textContent = `(${totalItems()})`;
}

/* =========================
   MODAL
========================= */
confirmBtn.addEventListener("click", () => {
  if (cart.length === 0) return;
  modal.classList.remove("hidden");

  modalItems.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.qty * item.price;
    const row = document.createElement("div");
    row.className = "flex justify-between py-1";
    row.innerHTML = `
      <span>${item.title} <span class="text-rose500">x${item.qty}</span></span>
      <span class="font-semibold">${fmt(item.qty * item.price)}</span>
    `;
    modalItems.appendChild(row);
  });

  modalTotal.textContent = fmt(total);
  showToast("Order confirmed!");
});

newOrderBtn.addEventListener("click", () => {
  cart = [];
  updateCart();
  modal.classList.add("hidden");
  resetAllCards();
});

// close modal on backdrop click or ESC
modal.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); });
document.addEventListener("keydown", e => { if (e.key === "Escape") modal.classList.add("hidden"); });

/* =========================
   UTIL
========================= */
function resetAllCards() {
  document.querySelectorAll("#grid article").forEach(card => {
    card.classList.remove("ring-2", "ring-rust");
    const addBtn = card.querySelector(".addBtn");
    const qtyBar = card.querySelector(".qtyBar");
    const qtyText = card.querySelector(".qty");
    if (addBtn && qtyBar && qtyText) {
      qtyBar.classList.add("hidden");
      addBtn.classList.remove("hidden");
      qtyText.textContent = "0";
    }
  });
}

/* =========================
   SEARCH + CATEGORY FILTER + CHIPS
========================= */
function readCard(card) {
  const name = card.dataset.name || card.querySelector("h3")?.textContent?.trim() || "";
  const category = card.dataset.category || card.querySelector(".p-5 p.text-xs, .p-5 p.uppercase")?.textContent?.trim() || "";
  const priceP = Array.from(card.querySelectorAll(".p-5 p")).pop();
  const price = card.dataset.price || priceP?.textContent?.match(/[\d.,]+/)?.[0] || "";
  const text = [name, category, ...Array.from(card.querySelectorAll(".p-5 p")).map(p => p.textContent)]
    .join(" ")
    .toLowerCase();
  return { el: card, name, category, price, text };
}

function rebuildIndex() {
  index = [];
  categories = new Set();
  grid.querySelectorAll("article").forEach(card => {
    const item = readCard(card);
    index.push(item);
    if (item.category) categories.add(item.category);
  });
  populateCategories();
  renderChips();
  applyFilters(); // show/hide after each render
}

function populateCategories() {
  if (!categoryFilter) return;
  const selected = categoryFilter.value;
  categoryFilter.querySelectorAll("option:not(:first-child)").forEach(o => o.remove());
  Array.from(categories).sort((a,b)=>a.localeCompare(b)).forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat; opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
  if ([...categories].includes(selected)) categoryFilter.value = selected;
}

function toggleEmptyState(show, q, cat) {
  if (show) {
    if (!emptyStateEl) {
      emptyStateEl = document.createElement("div");
      emptyStateEl.className = "col-span-full rounded-2xl border bg-white p-8 text-center text-rose500";
      grid.appendChild(emptyStateEl);
    }
    emptyStateEl.innerHTML = `
      <p class="font-semibold text-rose900 mb-1">No matches found</p>
      <p>Try a different search${cat ? ` or clear “${cat}”.` : "."}</p>`;
  } else if (emptyStateEl) {
    emptyStateEl.remove();
    emptyStateEl = null;
  }
}

function applyFilters() {
  const q = (searchInput?.value || "").toLowerCase().trim();
  const cat = categoryFilter?.value || "";
  index.forEach(item => {
    const matchText = !q || item.text.includes(q);
    const matchCat = !cat || item.category === cat;
    item.el.classList.toggle("hidden", !(matchText && matchCat));
  });
  const anyVisible = index.some(i => !i.el.classList.contains("hidden"));
  toggleEmptyState(!anyVisible, q, cat);
}

function renderChips(){
  if (!categoryChips) return;
  const cats = Array.from(categories).sort((a,b)=>a.localeCompare(b)).slice(0,6);
  const active = categoryFilter?.value || '';
  categoryChips.innerHTML = '';
  const mk = (label, value) => {
    const isActive = value === active || (!value && !active);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `px-3 py-1 rounded-full border text-sm shadow-soft ${isActive? 'bg-rust text-white border-rust' : 'bg-white text-rose900 hover:bg-rose50'}`;
    b.textContent = label;
    b.addEventListener('click', ()=> { categoryFilter.value = value || ''; applyFilters(); renderChips(); });
    return b;
  };
  categoryChips.appendChild(mk('All',''));
  cats.forEach(c => categoryChips.appendChild(mk(c,c)));
}

/* =========================
   EVENTS
========================= */
if (searchInput) searchInput.addEventListener("input", debounce(()=> { renderProducts(products); /* re-renders & filters */ }, 120));
if (clearBtn) clearBtn.addEventListener("click", () => { searchInput.value = ""; renderProducts(products); searchInput.focus(); });
if (categoryFilter) categoryFilter.addEventListener("change", () => { renderProducts(products); });
if (sortSelect) sortSelect.addEventListener("change", () => { renderProducts(products); });

/* =========================
   INIT
========================= */
renderProducts(products);
updateCart();
