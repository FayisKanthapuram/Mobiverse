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

async function addToCart(variantId) {
  try {
    const response = await axios.post("/cart/add", { variantId, quantity: 1 });
    if (response.data.success&&response.data.message) {
      Toastify({
        text: "Product already existed in cart, quantity incremented",
        duration: 4000,
        gravity: "top", // top or bottom
        position: "right", // left, center, right
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        close: true,
        stopOnFocus: true,
      }).showToast();
    }else if (response.data.success) {
      Toastify({
        text: "Item added to cart",
        duration: 4000,
        gravity: "top", // top or bottom
        position: "right", // left, center, right
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        close: true,
        stopOnFocus: true,
      }).showToast();
    }
  } catch (error) {
    console.log(error);
    Toastify({
      text: error.response?.data?.message || "Something went wrong",
      duration: 2000,
      gravity: "top",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  }
}

const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get("message");
let text = "";
if (message === "login-success") {
  text = "User login successfully";
}

if (message) {
  Toastify({
    text,
    duration: 4000,
    gravity: "top", // top or bottom
    position: "right", // left, center, right
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
    close: true,
    stopOnFocus: true,
  }).showToast();
}
