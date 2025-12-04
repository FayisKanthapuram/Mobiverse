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
        gravity: "top",
        position: "right",
        style: {
          background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
        close: true,
      }).showToast();
    }

  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Something went wrong",
      duration: 2000,
      gravity: "top",
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
  
  const btnDetails = document.querySelector(`[data-cart-variant-id-details="${variantId}"]`);
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