function brandFilter(e) {
  const brand = e.getAttribute("name") || "";
  const url = new URL(window.location);
  if (brand) {
    url.searchParams.set("brand", brand);
  } else {
    url.searchParams.delete("brand");
  }
  url.searchParams.set("page", 1);
  window.location = url.href;
}

function applyFilter() {
  const sortBy = document.getElementById("sort-by").value || "";
  const minPrice = document.getElementById("price-from").value;
  const maxPrice = document.getElementById("price-to").value;
  const url = new URL(window.location);
  if (sortBy) {
    url.searchParams.set("sort", sortBy);
  } else {
    url.searchParams.delete("sort");
  }
  if (minPrice) {
    url.searchParams.set("min", minPrice);
  } else {
    url.searchParams.delete("min");
  }
  if (maxPrice) {
    url.searchParams.set("max", maxPrice);
  } else {
    url.searchParams.delete("max");
  }
  url.searchParams.set("page", 1);
  window.location = url.href;
}

function changePage(page) {
  const url = new URL(window.location);
  if (page) {
    url.searchParams.set("page", page);
  } else {
    url.searchParams.delete("page");
  }
  window.location.href = url.href;
}

async function addToCart(variantId) {
  try {
    const response = await axios.post("/cart/add", { variantId, quantity: 1 });

    if (response.data.success) {

      // Update cart button
      updateCartButton(variantId);

      // REMOVE wishlist button completely
      removeWishlistButton(variantId);

      Toastify({
        text: "Item added to cart",
        duration: 4000,
        gravity: "bottom",
        position: "right",
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        close: true,
      }).showToast();
    }

  } catch (error) {
    if (error?.response?.data?.redirect) {
      sessionStorage.setItem("toastError", error.response?.data?.message);
      window.location.href = error.response?.data?.redirect;
    }
    Toastify({
      text: error.response?.data?.message || "Something went wrong",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: { background: "#e74c3c" },
    }).showToast();
  }
}



function removeWishlistButton(variantId) {
  const buttons = document.querySelectorAll(`[data-variant-id="${variantId}"]`);
  buttons.forEach(btn => btn.remove());
}



function updateCartButton(variantId) {
  const btn = document.querySelector(`[data-cart-variant-id="${variantId}"]`);
  if (!btn) return;

  // Replace button HTML with "Go to Cart"
  btn.outerHTML = `
      <button type="button" 
        class="w-full bg-white text-blue-600 border border-blue-600 font-semibold 
               py-2.5 rounded-full text-sm shadow-sm hover:bg-blue-600 hover:text-white 
               active:scale-[0.97] transition-all flex items-center justify-center gap-2"
        onclick="event.preventDefault(); event.stopPropagation(); window.location.href='/cart'">
          <i class="bi bi-arrow-right-circle"></i>
          Go to Cart
      </button>
    `;
}

// Clear all filters and redirect to base shop page
function clearAllFilters() {
  // Get current search query if it exists
  const url = new URL(window.location.href);
  const searchQuery = url.searchParams.get("search");

  // Redirect to shop with only search parameter if it exists
  if (searchQuery) {
    window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
  } else {
    window.location.href = "/shop";
  }
}

// Remove individual filters
function removeBrandFilter() {
  const url = new URL(window.location.href);
  url.searchParams.delete("brand");
  window.location.href = url.toString();
}

function removePriceFilter() {
  const url = new URL(window.location.href);
  url.searchParams.delete("min");
  url.searchParams.delete("max");
  window.location.href = url.toString();
}

function removeSortFilter() {
  const url = new URL(window.location.href);
  url.searchParams.delete("sort");
  window.location.href = url.toString();
}
