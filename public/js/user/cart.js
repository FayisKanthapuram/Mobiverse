// Update Quantity
document.addEventListener("click", async (e) => {
  if (!e.target.closest(".qty-btn")) return;

  const btn = e.target.closest(".qty-btn");
  const itemId = btn.dataset.itemId;
  const newQuantity = Number(btn.dataset.newQty);

  updateQuantity(itemId, newQuantity);
});

async function updateQuantity(itemId, newQuantity) {
  if (newQuantity < 1) return;

  try {
    const response = await axios.patch(`/cart/update/${itemId}`, {
      quantity: newQuantity,
    });

    const updated = response.data.updatedItem;
    const cartTotals = response.data.cartTotals;

    document.querySelector(`#qty-${itemId}`).innerText = updated.quantity;
    if(cartTotals.offer){
      document.querySelector(`#offprice-${itemId}`).innerText =
      "₹" + ((updated.salePrice-cartTotals.offer) * updated.quantity).toLocaleString("en-IN");
    }
    document.querySelector(`#price-${itemId}`).innerText =
      "₹" + ((updated.salePrice) * updated.quantity).toLocaleString("en-IN");
    if (document.querySelector(`#regPrice-${itemId}`).innerText) {
      document.querySelector(`#regPrice-${itemId}`).innerHTML = `<del>₹${(
        updated.regularPrice * updated.quantity
      ).toLocaleString("en-IN")}</del>`;
    }

    document.querySelector("#subtotal").innerText =
      "₹" + cartTotals.subtotal.toLocaleString("en-IN");

    document.querySelector("#total").innerText =
      "₹" + (cartTotals.subtotal-cartTotals.discount).toLocaleString("en-IN");
    console.log(cartTotals)
    if (cartTotals.discount > 0) {
      document.querySelector("#savings").innerText =
        cartTotals.discount.toLocaleString("en-IN");
      document.querySelector("#discount").innerText =
        "-₹" + cartTotals.discount.toLocaleString("en-IN");
    }

    // 🔥 Update button dataset after updated qty
    const buttons = document.querySelectorAll(
      `button.qty-btn[data-item-id="${itemId}"]`
    );
    buttons.forEach((btn) => {
      const isMinus = btn.querySelector("i").classList.contains("bi-dash");

      if (isMinus) {
        btn.dataset.newQty = updated.quantity - 1;
        btn.disabled = updated.quantity <= 1;
        btn.classList.toggle("opacity-50", updated.quantity <= 1);
        btn.classList.toggle("cursor-not-allowed", updated.quantity <= 1);
      } else {
        btn.dataset.newQty = updated.quantity + 1;
        const max = updated.stock;
        btn.disabled = updated.quantity >= max;
        btn.classList.toggle("opacity-50", updated.quantity >= max);
        btn.classList.toggle("cursor-not-allowed", updated.quantity >= max);
      }
    });
    Toastify({
      text: "Quantity updated",
      duration: 1500,
      gravity: "bottom",
      position: "right",
      close: true,
      style: {
        background: "#22c55e",
      },
    }).showToast();
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Something went wrong",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: { background: "#e74c3c" },
    }).showToast();
  }
}

// Remove from Cart
async function removeFromCart(itemId) {
  if (!confirm("Are you sure you want to remove this item from cart?")) {
    return;
  }

  try {
    const response = await axios.delete(`/cart/remove/${itemId}`);
    if (response.data.success) {
      window.location.href='/cart?message=item-delete'
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Failed to remove item",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: { background: "#e74c3c" },
    }).showToast();
  }
}

// Add to Cart (for related products)
async function addToCart(variantId) {
  try {
    const response = await axios.post("/cart/add", { variantId, quantity: 1 });
    if (response.data.success&&response.data.message) {
      window.location.href = "/cart?message=cart-inc";
    }else if (response.data.success) {
      window.location.href = "/cart?message=cart-add";
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
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  }
}


const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get("message");
let text = "";
if (message === "cart-add") {
  text = "Item added to cart";
}else if(message==='item-delete'){
  text="Item successfully removed from the cart."
}else if(message==='cart-inc'){
  text="Product already existed in cart, quantity incremented"
}else if(message==='adjested'){
  text="Cart quantity was adjusted due to stock limits. Please review your cart."
}

if (message) {
  Toastify({
    text,
    duration: 4000,
    gravity: "bottom", // top or bottom
    position: "right", // left, center, right
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
    close: true,
    stopOnFocus: true,
  }).showToast();
}
