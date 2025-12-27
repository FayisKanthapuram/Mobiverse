async function addToCart(variantId) {
  try {
    const response = await axios.post("/cart/add", { variantId, quantity: 1 });

    if (response.data.success) {
      // Update cart button
      updateCartButton(variantId);

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

  const btnDetails = document.querySelector(
    `[data-cart-variant-id-details="${variantId}"]`
  );
  if (!btnDetails) return;

  btnDetails.outerHTML = `
    <button 
      onclick="event.preventDefault(); window.location.href='/cart'"
      class="flex-1 bg-white border border-blue-600 text-blue-600 py-3 rounded-lg font-medium"
    >
      <i class="bi bi-arrow-right-circle"></i> Go to Cart
    </button>
  `;
}

// Change Image
function changeImage(imageSrc, event) {
  document.getElementById("mainImage").src = imageSrc;
  document.getElementById("zoomedImage").src = imageSrc;
  const thumbnails = document.querySelectorAll(
    'button[onclick^="changeImage"]'
  );
  thumbnails.forEach((thumb) => {
    thumb.classList.remove("border-blue-600");
    thumb.classList.add("border-gray-200");
  });
  event.currentTarget.classList.remove("border-gray-200");
  event.currentTarget.classList.add("border-blue-600");
}

// Zoom
const imageContainer = document.getElementById("imageContainer");
const mainImage = document.getElementById("mainImage");
const zoomLens = document.getElementById("zoomLens");
const zoomResult = document.getElementById("zoomResult");
const zoomedImage = document.getElementById("zoomedImage");
const zoomLevel = 2.5,
  lensWidth = 150,
  lensHeight = 150;

imageContainer.addEventListener("mouseenter", () => {
  // Check if image is loaded before showing zoom
  if (mainImage.naturalWidth === 0) return;
  zoomLens.classList.remove("hidden");
  zoomResult.classList.remove("hidden");
});

imageContainer.addEventListener("mouseleave", () => {
  zoomLens.classList.add("hidden");
  zoomResult.classList.add("hidden");
});

// --- THIS IS THE CORRECTED FUNCTION ---
imageContainer.addEventListener("mousemove", (e) => {
  const containerRect = imageContainer.getBoundingClientRect(); // The outer div
  const imageRect = mainImage.getBoundingClientRect(); // The <img> tag

  // The <img> tag's box dimensions (since it's w-full, h-full)
  const boxWidth = imageRect.width;
  const boxHeight = imageRect.height;

  // The original image file's dimensions
  const imgNaturalWidth = mainImage.naturalWidth;
  const imgNaturalHeight = mainImage.naturalHeight;

  // If image not loaded, stop.
  if (imgNaturalWidth === 0) return;

  // --- START OF FIX ---
  // Calculate aspect ratios to figure out 'object-contain'
  const boxRatio = boxWidth / boxHeight;
  const imgRatio = imgNaturalWidth / imgNaturalHeight;

  let displayWidth, displayHeight;

  // Calculate the actual rendered size of the image within its box
  if (imgRatio > boxRatio) {
    // Image is wider than box (letterboxed)
    displayWidth = boxWidth;
    displayHeight = displayWidth / imgRatio;
  } else {
    // Image is taller than box (pillarboxed)
    displayHeight = boxHeight;
    displayWidth = displayHeight * imgRatio;
  }

  // Calculate the padding (empty space) inside the <img> box
  const offsetX = (boxWidth - displayWidth) / 2;
  const offsetY = (boxHeight - displayHeight) / 2;
  // --- END OF FIX ---

  // Mouse position relative to the container div
  const mouseX = e.clientX - containerRect.left;
  const mouseY = e.clientY - containerRect.top;

  // Check if mouse is over the *visible image*, not the padding
  if (
    mouseX < offsetX ||
    mouseY < offsetY ||
    mouseX > offsetX + displayWidth ||
    mouseY > offsetY + displayHeight
  ) {
    zoomLens.classList.add("hidden");
    zoomResult.classList.add("hidden");
    return;
  }

  // Show lens and zoom box if we're over the image
  zoomLens.classList.remove("hidden");
  zoomResult.classList.remove("hidden");

  // Calculate lens position, clamped to the visible image boundaries
  let lensX = Math.max(
    offsetX,
    Math.min(mouseX - lensWidth / 2, offsetX + displayWidth - lensWidth)
  );
  let lensY = Math.max(
    offsetY,
    Math.min(mouseY - lensHeight / 2, offsetY + displayHeight - lensHeight)
  );

  // Apply lens position
  zoomLens.style.left = lensX + "px";
  zoomLens.style.top = lensY + "px";

  // Scale the image inside the zoom result box
  zoomedImage.style.width = displayWidth * zoomLevel + "px";
  zoomedImage.style.height = displayHeight * zoomLevel + "px";

  // Calculate the ratio of the lens's position on the visible image
  // (e.g., 0.5 means 50% across)
  const ratioX = (lensX - offsetX) / displayWidth;
  const ratioY = (lensY - offsetY) / displayHeight;

  // Move the scaled-up image inside the zoom box
  // This moves it *opposite* to the lens, by the same ratio
  zoomedImage.style.transform = `translate(-${
    ratioX * zoomedImage.offsetWidth
  }px, -${ratioY * zoomedImage.offsetHeight}px)`;
});

// Variant Selector
function selectVariant(variantId) {
  window.location.href = "/products/" + variantId;
}

function showConfigurations(color, variantId) {
  // reload to show that color’s variants
  console.log(variantId);
  window.location.href = `/products/${variantId}?color=${color}`;
}

async function toggleWishlist(variantId, event) {
  event?.preventDefault();
  event?.stopPropagation();

  try {
    const res = await axios.post("/wishlist/toggle", {
      variantId,
    });

    const isAdded = res.data.action === "added";

    Toastify({
      text: res.data.message,
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: isAdded ? "#10b981" : "#ef4444",
      close: true,
    }).showToast();

    updateWishlistIcon(variantId, isAdded);
    updateWishlistBadge(res.data.itemCount);
  } catch (err) {
    if (err.response?.status === 401) {
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

// Update wishlist heart icon
function updateWishlistIcon(variantId, isAdded) {
  const btn = document.querySelector(`[data-variant-id="${variantId}"]`);
  if (!btn) return;

  const icon = btn.querySelector(".wishlist-icon");

  if (isAdded) {
    icon.classList.remove("bi-heart");
    icon.classList.add("bi-heart-fill", "text-red-500");
  } else {
    icon.classList.add("bi-heart");
    icon.classList.remove("bi-heart-fill", "text-red-500");
  }
}

// Update badge in navbar
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
async function addToCartItem(variantId) {
  try {
    const response = await axios.post("/cart/add", {
      variantId,
      quantity: 1,
    });

    if (response.data.success) {
      // Change Add → Go to Cart
      updateDetailCartButton(variantId);


      Toastify({
        text: "Added to cart",
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
      text: error.response?.data?.message || "Error adding to cart",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#e74c3c",
      close: true,
    }).showToast();
  }
}

// Replace Add to Cart with Go to Cart
function updateDetailCartButton(variantId) {
  const btn = document.querySelector(
    `[data-cart-variant-id-details="${variantId}"]`
  );
  if (!btn) return;

  btn.outerHTML = `
    <button 
      onclick="event.preventDefault(); window.location.href='/cart'"
      class="flex-1 bg-white border border-blue-600 text-blue-600 py-3 rounded-lg font-medium"
    >
      <i class="bi bi-arrow-right-circle"></i> Go to Cart
    </button>
  `;
  const btnCard = document.querySelector(
    `[data-cart-variant-id="${variantId}"]`
  );
  if (!btnCard) return;

  // Replace button HTML with "Go to Cart"
  btnCard.outerHTML = `
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


// ----------------------------
// CHECK WISHLIST STATUS ON LOAD
// ----------------------------
async function checkWishlistStatusDetailPage() {
  const btn = document.querySelector(".wishlist-btn");
  if (!btn) return;

  const variantId = btn.getAttribute("data-variant-id");

  try {
    const res = await axios.get(`/wishlist/check/${variantId}`);

    if (res.data.success && res.data.inWishlist) {
      updateWishlistIcon(variantId, true);
    }
  } catch (err) {
    console.error("Wishlist check failed:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  checkWishlistStatusDetailPage();
});
