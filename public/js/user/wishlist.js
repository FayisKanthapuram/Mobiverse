async function removeFromWishlist(variantId) {
  try {
    const response = await axios.post(`/wishlist/toggle`, {
      variantId,
    });

    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.reload();
    }
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    Toastify({
      text: error.response?.data?.message || "Failed to remove item",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#ef4444",
    }).showToast();
  }
}

// Clear entire wishlist
async function clearWishlist() {
  const confirmed = confirm(
    "Are you sure you want to clear your entire wishlist?"
  );
  if (!confirmed) return;

  try {
    const response = await axios.delete("/wishlist/clear");

    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);

      window.location.reload();
    }
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    Toastify({
      text: error.response?.data?.message || "Failed to clear wishlist",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#ef4444",
    }).showToast();
  }
}

// Move item to cart
async function moveToCart(itemId, variantId) {
  try {
    const response = await axios.post("/cart/add", {
      variantId,
      quantity: 1,
      isMoveToCart: true,
    });
    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.reload();
    }
  } catch (error) {
    console.log(error);
    Toastify({
      text: error.response?.data?.message || "Something went wrong",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  }
}

// Pagination
function changeWishlistPage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
}
