(() => {
  const CART_KEY = "sabariCraftCart";
  const WISHLIST_KEY = "sabariCraftWishlist";

  function readStorage(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.error(`Could not read ${key} from local storage.`, error);
      return [];
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event("sabari-store-update"));
    } catch (error) {
      console.error(`Could not save ${key} to local storage.`, error);
      window.alert("Your browser could not save this item. Check your storage settings and try again.");
    }
  }

  function productBeads(item) {
    const value = item.beadCount ?? item.beads ?? item.bead_count ?? 108;
    return Number.parseInt(value, 10) === 54 ? 54 : 108;
  }

  function updateBadges() {
    const cartCount = readStorage(CART_KEY).reduce(
      (count, item) => count + Math.max(1, Number(item.quantity) || 1),
      0
    );
    const wishlistCount = readStorage(WISHLIST_KEY).length;

    document.querySelectorAll("[data-cart-count]").forEach(badge => {
      const value = String(cartCount);
      if (badge.textContent !== value) badge.textContent = value;
      badge.closest("a")?.setAttribute(
        "aria-label",
        `Shopping cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`
      );
    });
    document.querySelectorAll("[data-wishlist-count]").forEach(badge => {
      const value = String(wishlistCount);
      if (badge.textContent !== value) badge.textContent = value;
      badge.closest("a")?.setAttribute(
        "aria-label",
        `Wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}`
      );
    });
  }

  function syncWishlistButtons() {
    const wishlistIds = new Set(
      readStorage(WISHLIST_KEY).map(item =>
        String(item.id ?? item.productId ?? item.name ?? "")
      )
    );

    document.querySelectorAll('[data-product-action="wishlist"]').forEach(button => {
      const isSaved = wishlistIds.has(button.dataset.productId);
      const state = isSaved ? "saved" : "unsaved";
      if (button.dataset.currentState === state) return;

      button.dataset.currentState = state;
      button.setAttribute("aria-pressed", String(isSaved));
      button.setAttribute(
        "aria-label",
        `${isSaved ? "Remove" : "Add"} ${button.dataset.productName} ${isSaved ? "from" : "to"} wishlist`
      );
      button.innerHTML = `
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/>
        </svg>`;
    });
  }

  function syncCartButtons() {
    const cartIds = new Set(
      readStorage(CART_KEY)
        .filter(item => item && (item.id || item.productId || item.name))
        .map(item => String(item.id ?? item.productId ?? item.name ?? ""))
    );

    document.querySelectorAll('[data-product-action="cart"]').forEach(button => {
      const isInCart = cartIds.has(button.dataset.productId);
      const state = isInCart ? "in-cart" : "not-in-cart";
      if (button.dataset.currentState === state) return;

      button.dataset.currentState = state;
      button.setAttribute(
        "aria-label",
        `${isInCart ? "Remove" : "Add"} ${button.dataset.productName} ${isInCart ? "from" : "to"} cart`
      );
      button.classList.add("bg-white", "text-[#78452B]");
      button.classList.remove("bg-[#78452B]", "text-white");
      button.innerHTML = `
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
             aria-hidden="true">
          <path d="M2 3h3l3.2 13h11" />
          <path d="M8 8h13l-2 8h-11z" fill="${isInCart ? "currentColor" : "none"}"/>
          <circle cx="10.5" cy="20" r="1.5" fill="${isInCart ? "currentColor" : "none"}"/>
          <circle cx="18.5" cy="20" r="1.5" fill="${isInCart ? "currentColor" : "none"}"/>
        </svg>`;
    });
  }

  function syncNavbarCartState() {
    const cartLink = document.querySelector('a[href="cart.html"]');
    if (!cartLink) return;

    const cartItems = readStorage(CART_KEY);
    const hasItems = cartItems.length > 0;
    const cartIcon = cartLink.querySelector("svg");
    if (!cartIcon) return;

    cartIcon.setAttribute("fill", hasItems ? "currentColor" : "none");
    cartLink.classList.toggle("bg-[#FAF7F0]", hasItems);
    cartLink.classList.toggle("text-[#A46F2D]", hasItems);
    cartLink.classList.toggle("text-[#78452B]", !hasItems);
  }

  function updateInterface() {
    updateBadges();
    syncWishlistButtons();
    syncCartButtons();
    syncNavbarCartState();
  }

  document.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;

    const button = event.target.closest("[data-product-action]");
    if (!button) return;

    const card = button.closest("article[data-product-id]");
    if (!card) {
      console.error("Product action button is not inside a product card.");
      return;
    }

    const id = card.dataset.productId;
    const name = card.dataset.productName;
    const price = Number(card.dataset.productPrice);
    const image = card.dataset.productImage || "";
    const category = card.dataset.productCategory || "";
    const selector = card.querySelector('select[id^="beads-"], select[id^="variety-"]');
    const selectedVariety = selector?.value || "108 Beads";
    const beads = productBeads({ beads: selectedVariety });
    const quantityInput = card.querySelector('input[id^="quantity-"]');
    const requestedQuantity = Number(quantityInput?.value);
    const quantity = Number.isFinite(requestedQuantity) && requestedQuantity >= 1
      ? Math.floor(requestedQuantity)
      : 1;
    const smallPriceFactor = Number(card.dataset.smallPriceFactor) || 1;
    const unitPrice = beads === 54 ? Math.round(price * smallPriceFactor) : price;

    if (!id || !name || !Number.isFinite(price) || price < 0) {
      console.error("Product card has invalid product data.", card);
      return;
    }

    const product = {
      id,
      name,
      category,
      image,
      whatsappImage: card.dataset.whatsappImage || new URL(image, window.location.href).href,
      beadCount: beads,
      unitPrice
    };

    if (button.dataset.productAction === "wishlist") {
      const wishlist = readStorage(WISHLIST_KEY);
      const existingIndex = wishlist.findIndex(item =>
        String(item.id ?? item.productId ?? item.name ?? "") === id
      );

      if (existingIndex >= 0) {
        wishlist.splice(existingIndex, 1);
      } else {
        wishlist.push(product);
      }

      writeStorage(WISHLIST_KEY, wishlist);
      updateInterface();
      return;
    }

    const cart = readStorage(CART_KEY);
    const existing = cart.find(item =>
      String(item.id ?? item.productId ?? item.name ?? "") === id &&
      productBeads(item) === beads &&
      Number(item.unitPrice ?? item.price ?? 0) === unitPrice
    );

    if (existing) {
      existing.quantity = Math.max(1, Number(existing.quantity) || 1) + quantity;
    } else {
      cart.push({ ...product, quantity });
    }

    writeStorage(CART_KEY, cart);
    updateInterface();
    button.setAttribute("aria-label", `Added ${quantity} ${name} to cart`);
    window.setTimeout(() => {
      if (button.isConnected) {
        button.setAttribute("aria-label", `Add ${name} to cart`);
      }
    }, 1200);
  });

  window.addEventListener("storage", updateInterface);
  window.addEventListener("sabari-store-update", updateInterface);
  document.addEventListener("DOMContentLoaded", updateInterface);
  new MutationObserver(updateInterface).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  updateInterface();
})();
