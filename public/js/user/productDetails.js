async function addToCart(variantId) {
  try {
    const response = await axios.post("/cart/add", { variantId, quantity: 1 });
    console.log(response.data.success);
    if (response.data.success && response.data.message) {
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
    } else if (response.data.success) {
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
