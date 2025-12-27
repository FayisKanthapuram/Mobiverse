// /js/user/home.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Initialize Hero Carousel ---
  const heroSwiper = new Swiper("#hero-carousel", {
    // Optional parameters
    loop: true,
    effect: "fade", // Use fade effect
    fadeEffect: {
      crossFade: true,
    },
    autoplay: {
      delay: 5000,
      disableOnInteraction: false,
    },

    // If we need pagination
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },

    // Navigation arrows
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });

  // --- Initialize Latest Products Carousel ---
  const latestSwiper = new Swiper("#latest-carousel", {
    slidesPerView: 1, // Start with 1 slide on mobile
    spaceBetween: 20, // Gap between slides

    // Navigation arrows
    navigation: {
      nextEl: "#latest-carousel .product-carousel-next",
      prevEl: "#latest-carousel .product-carousel-prev",
    },

    // Responsive breakpoints
    breakpoints: {
      // when window width is >= 640px (sm)
      640: {
        slidesPerView: 2,
      },
      // when window width is >= 768px (md)
      768: {
        slidesPerView: 3,
      },
      // when window width is >= 1024px (lg)
      1024: {
        slidesPerView: 4,
      },
    },
  });

  // --- Initialize Popular Products Carousel ---
  const popularSwiper = new Swiper("#popular-carousel", {
    slidesPerView: 1,
    spaceBetween: 20,

    navigation: {
      nextEl: "#popular-carousel .product-carousel-next",
      prevEl: "#popular-carousel .product-carousel-prev",
    },

    breakpoints: {
      640: {
        slidesPerView: 2,
      },
      768: {
        slidesPerView: 3,
      },
      1024: {
        slidesPerView: 4,
      },
    },
  });
});

// ----------------------------
// ❤️ TOGGLE WISHLIST
// ----------------------------
async function toggleWishlist(variantId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  try {
    const response = await axios.post("/wishlist/toggle", {
      variantId,
    });

    if (response.data.success) {
      const isAdded = response.data.action === "added";

      Toastify({
        text: response.data.message,
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: isAdded ? "#10b981" : "#ef4444",
        close: true,
      }).showToast();

      updateWishlistButton(variantId, isAdded);
      updateWishlistBadge(response.data.itemCount);
    }
  } catch (error) {
    console.error("Wishlist error:", error);

    if (error.response?.status === 401) {
      Toastify({
        text: "Please login to add items to wishlist",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#ef4444",
      }).showToast();

      setTimeout(() => (window.location.href = "/login"), 1200);
    }
  }
}

// ----------------------------
// ❤️ UPDATE WISHLIST ICON UI
// ----------------------------
function updateWishlistButton(variantId, inWishlist) {
  const buttons = document.querySelectorAll(`[data-variant-id="${variantId}"]`);

  buttons.forEach((btn) => {
    const icon = btn.querySelector(".wishlist-icon");
    if (!icon) return;

    if (inWishlist) {
      icon.classList.remove("bi-heart");
      icon.classList.add("bi-heart-fill", "text-red-500");
      btn.classList.add("text-red-500");
    } else {
      icon.classList.remove("bi-heart-fill", "text-red-500");
      icon.classList.add("bi-heart");
      btn.classList.remove("text-red-500");
    }
  });
}

// ----------------------------
// ❤️ NAVBAR BADGE UPDATE
// ----------------------------
function updateWishlistBadge(count) {
  const badge = document.querySelector('a[href="/wishlist"] span');
  if (!badge) return;

  badge.textContent = count;

  if (count > 0) badge.classList.remove("hidden");
  else badge.classList.add("hidden");
}

// ----------------------------
// 🛒 ADD TO CART
// ----------------------------
async function addToCart(variantId) {
  try {
    const response = await axios.post("/cart/add", {
      variantId,
      quantity: 1,
    });

    if (response.data.success) {
      updateCartButton(variantId);

      Toastify({
        text: "Item added to cart",
        duration: 3000,
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
      backgroundColor: "#e74c3c",
    }).showToast();
  }
}


// ----------------------------
// 🔄 UPDATE CART BUTTON (Add → Go to Cart)
// ----------------------------
function updateCartButton(variantId) {
  console.log(variantId);
  const btn = document.querySelectorAll(
    `[data-cart-variant-id="${variantId}"]`
  );
  if (btn.length === 0) return;
  btn.forEach((b) => {
    b.outerHTML = `
      <button 
        type="button"
        class="absolute left-0 bottom-0 w-full bg-white text-blue-600 border border-blue-600 
               font-semibold py-3 rounded-b-2xl text-center"
        onclick="event.preventDefault(); window.location.href='/cart'"
      >
        <i class="bi bi-arrow-right-circle"></i> Go to Cart
      </button>
    `;
  });
}
