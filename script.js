/* =========================================================
   PIKO Y POLLO — script principal
   Catálogo, filtros, carrito lateral, pedido por WhatsApp,
   menú móvil, scroll reveal, galería con lightbox.
   ========================================================= */

(() => {
  "use strict";

  /* ---------- Config ---------- */
  // TODO: reemplaza por el número real de WhatsApp del negocio (formato 57XXXXXXXXXX, sin +).
  const WHATSAPP_NUMBER = "573000000000";

  const money = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  /* ---------- Catálogo de productos ---------- */
  const PRODUCTS = [
    {
      id: "PK-001",
      name: "Pollo Entero Limpio",
      desc: "Bandeja individual de 1.8 – 2.2 kg, listo para preparar.",
      price: 24900,
      category: "entero",
      tag: "Ave entera",
      img: "polloentero.png",
    },
    {
      id: "PK-002",
      name: "Pechuga Deshuesada",
      desc: "Bandeja de 1 kg, empacada al vacío, sin hueso ni piel.",
      price: 19900,
      category: "cortes",
      tag: "Corte",
      img: "pechuga.png",
    },
    {
      id: "PK-003",
      name: "Alitas Marinadas BBQ / Picante",
      desc: "Empaque de 500 g, listas para asar o freír.",
      price: 14500,
      category: "preparado",
      tag: "Preparado",
      img: "alitasmarinadas.png",
    },
    {
      id: "PK-004",
      name: "Nuggets de Pollo Empanizados",
      desc: "Caja congelada x 20 unidades, ideal para la familia.",
      price: 16900,
      category: "preparado",
      tag: "Preparado",
      img: "nuggets.png",
    },
    {
      id: "PK-005",
      name: "Embutidos — Salchicha de Pollo",
      desc: "Paquete de 8 unidades, bajo en grasa.",
      price: 11500,
      category: "embutido",
      tag: "Embutido",
      img: "chorizos.png",
    },
  ];

  /* ---------- Estado del carrito ---------- */
  let cart = loadCart();

  function loadCart() {
    try {
      const raw = localStorage.getItem("pikoCart");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }
  function saveCart() {
    try { localStorage.setItem("pikoCart", JSON.stringify(cart)); } catch { /* almacenamiento no disponible */ }
  }

  /* ---------- Render catálogo ---------- */
  const grid = document.getElementById("productGrid");

  function renderProducts(filter = "todos") {
    const items = filter === "todos" ? PRODUCTS : PRODUCTS.filter((p) => p.category === filter);
    grid.innerHTML = items
      .map(
        (p) => `
      <article class="product-card">
        <div class="product-media"><img src="${p.img}" alt="${p.name}" loading="lazy"></div>
        <div class="product-body">
          <span class="product-tag">${p.tag}</span>
          <h3>${p.name}</h3>
          <p class="product-desc">${p.desc}</p>
          <div class="product-footer">
            <span class="product-price">${money(p.price)}</span>
            <button class="add-btn" data-id="${p.id}">Agregar</button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }
  renderProducts();

  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".filter-chip").forEach((c) => {
        c.classList.remove("is-active");
        c.setAttribute("aria-selected", "false");
      });
      chip.classList.add("is-active");
      chip.setAttribute("aria-selected", "true");
      renderProducts(chip.dataset.filter);
    });
  });

  /* ---------- Agregar al carrito (delegación) ---------- */
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest(".add-btn");
    if (!btn) return;
    const id = btn.dataset.id;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    btn.textContent = "Agregado ✓";
    btn.classList.add("added");
    setTimeout(() => {
      btn.textContent = "Agregar";
      btn.classList.remove("added");
    }, 1200);
  });

  /* ---------- Carrito lateral ---------- */
  const cartPanel = document.getElementById("cartPanel");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartItemsEl = document.getElementById("cartItems");
  const cartEmptyEl = document.getElementById("cartEmpty");
  const cartCountEl = document.getElementById("cartCount");
  const cartTotalEl = document.getElementById("cartTotal");
  const cartCheckoutBtn = document.getElementById("cartCheckout");

  function openCart() {
    cartPanel.classList.add("is-open");
    cartOverlay.classList.add("is-open");
    cartPanel.setAttribute("aria-hidden", "false");
  }
  function closeCart() {
    cartPanel.classList.remove("is-open");
    cartOverlay.classList.remove("is-open");
    cartPanel.setAttribute("aria-hidden", "true");
  }
  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeCart(); closeLightbox(); }
  });

  function cartEntries() {
    return Object.entries(cart)
      .map(([id, qty]) => ({ product: PRODUCTS.find((p) => p.id === id), qty }))
      .filter((e) => e.product && e.qty > 0);
  }

  function renderCart() {
    const entries = cartEntries();
    const totalQty = entries.reduce((s, e) => s + e.qty, 0);
    const totalPrice = entries.reduce((s, e) => s + e.qty * e.product.price, 0);

    cartCountEl.textContent = totalQty;
    cartTotalEl.textContent = money(totalPrice);
    cartCheckoutBtn.disabled = entries.length === 0;

    if (entries.length === 0) {
      cartItemsEl.innerHTML = "";
      cartItemsEl.appendChild(cartEmptyEl);
      return;
    }

    cartItemsEl.innerHTML = entries
      .map(
        (e) => `
      <div class="cart-line" data-id="${e.product.id}">
        <img src="${e.product.img}" alt="${e.product.name}">
        <div class="cart-line-body">
          <div class="cart-line-top">
            <h4>${e.product.name}</h4>
            <button class="cart-line-remove" data-action="remove" data-id="${e.product.id}">Quitar</button>
          </div>
          <div class="qty-control">
            <button data-action="dec" data-id="${e.product.id}" aria-label="Restar unidad">−</button>
            <span>${e.qty}</span>
            <button data-action="inc" data-id="${e.product.id}" aria-label="Sumar unidad">+</button>
          </div>
          <span class="cart-line-price">${money(e.qty * e.product.price)}</span>
        </div>
      </div>`
      )
      .join("");
  }

  cartItemsEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === "inc") cart[id] = (cart[id] || 0) + 1;
    if (action === "dec") cart[id] = Math.max(0, (cart[id] || 0) - 1);
    if (action === "remove") delete cart[id];
    if (cart[id] === 0) delete cart[id];
    saveCart();
    renderCart();
  });

  /* ---------- Pedido por WhatsApp ---------- */
  function buildWhatsappMessage() {
    const entries = cartEntries();
    if (entries.length === 0) return "Hola, quisiera hacer un pedido en Piko y Pollo.";
    const lines = entries.map((e) => `• ${e.product.name} x${e.qty} — ${money(e.qty * e.product.price)}`);
    const total = entries.reduce((s, e) => s + e.qty * e.product.price, 0);
    return [
      "Hola, quisiera hacer el siguiente pedido en Piko y Pollo:",
      "",
      ...lines,
      "",
      `Total estimado: ${money(total)}`,
    ].join("\n");
  }

  function whatsappLink(message) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  cartCheckoutBtn.addEventListener("click", () => {
    window.open(whatsappLink(buildWhatsappMessage()), "_blank", "noopener");
  });

  const heroWhatsapp = document.getElementById("heroWhatsapp");
  const whatsappFab = document.getElementById("whatsappFab");
  const genericMsg = "Hola, quisiera más información sobre los productos de Piko y Pollo.";
  heroWhatsapp.href = whatsappLink(genericMsg);
  whatsappFab.href = whatsappLink(genericMsg);

  /* ---------- Menú móvil ---------- */
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("main-nav");
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  mainNav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Formulario de contacto → WhatsApp ---------- */
  const form = document.getElementById("contactForm");
  const formNote = document.getElementById("formNote");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const data = new FormData(form);
    const msg = [
      `Hola, soy ${data.get("fname")}.`,
      `Teléfono: ${data.get("fphone")}`,
      `Me interesa: ${data.get("finterest")}`,
      "",
      data.get("fmsg"),
    ].join("\n");
    window.open(whatsappLink(msg), "_blank", "noopener");
    formNote.textContent = "Se abrió WhatsApp con tu mensaje listo para enviar.";
    form.reset();
  });

  /* ---------- Galería / lightbox ---------- */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  document.querySelectorAll(".gallery-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      lightboxImg.src = btn.dataset.full;
      lightboxImg.alt = btn.querySelector("img").alt;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    });
  });
  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
  }
  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Init ---------- */
  renderCart();
})();
