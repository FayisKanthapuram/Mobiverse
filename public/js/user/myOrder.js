let currentOrderData = null;

/* -------------------------------------------
   PRICE FORMATTER — REUSABLE COMPONENT
-------------------------------------------- */
function getPriceHtml(item) {
  const qty = item.quantity;
  const sale = item.price;                // sale price captured at purchase
  const regular = item.regularPrice || sale;
  const offer = item.offer || 0;
  const finalPrice = offer ? sale - offer : sale;

  let html = `
    <p class="text-sm font-semibold ${offer ? "text-green-600" : "text-gray-900"}">
      ₹${(finalPrice * qty).toLocaleString("en-IN")}
    </p>
  `;

  // Sale price strike
  if (offer) {
    html += `
      <p class="text-xs text-gray-500 line-through">
        ₹${(sale * qty).toLocaleString("en-IN")}
      </p>
    `;
  }

  // Regular price strike
  if (regular > sale) {
    html += `
      <p class="text-xs text-gray-500 line-through">
        ₹${(regular * qty).toLocaleString("en-IN")}
      </p>
    `;
  }

  return html;
}

/* -------------------------------------------
   DOM Content Loaded
-------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const orderSearchInput = document.getElementById("orderSearch");
  if (orderSearchInput) {
    orderSearchInput.addEventListener("input", toggleOrderClearButton);
  }

  toggleOrderClearButton();
});

/* -------------------------------------------
   CANCEL ORDER MODAL
-------------------------------------------- */
function openCancelOrderModal(order) {
  currentOrderData = order;
  document.getElementById("cancelItemOrderId").value = order._id;

  const cancelItemsList = document.getElementById("cancelItemsList");
  cancelItemsList.innerHTML = "";

  order.orderedItems.forEach((item) => {
    if (["Pending", "Confirmed", "Processing"].includes(item.itemStatus)) {
      const itemHtml = `
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
          <input type="checkbox" name="cancelItems[]" value="${item._id}"
            class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">

          <img src="${item.variantId.images[0]}" 
            alt="${item.productId.name}"
            class="w-12 h-12 object-contain bg-gray-100 rounded">

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              ${item.productId.name}
            </p>

            <div>${getPriceHtml(item)}</div>
          </div>
        </label>
      `;
      cancelItemsList.innerHTML += itemHtml;
    }
  });

  document.getElementById("cancelItemModal").classList.remove("hidden");
  document.getElementById("cancelItemModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeCancelItemModal() {
  document.getElementById("cancelItemModal").classList.add("hidden");
  document.getElementById("cancelItemModal").classList.remove("flex");
  document.body.style.overflow = "auto";
  document.getElementById("cancelItemForm").reset();
}

document.getElementById("cancelItemForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const orderId = formData.get("orderId");
  const cancelItems = formData.getAll("cancelItems[]");
  const reason = formData.get("reason");
  const comments = formData.get("comments");

  try {
    const response = await axios.post(`/order/${orderId}/cancel-items`, {
      itemIds: cancelItems,
      reason,
      comments,
    });

    const data = response.data;
    if (data && data.success) {
      Toastify({
        text: "Items cancelled successfully!",
        duration: 2500,
        gravity: "bottom",
        position: "right",
        backgroundColor: "linear-gradient(to right, #16a34a, #10b981)",
      }).showToast();

      closeCancelItemModal();
      setTimeout(() => window.location.reload(), 800);
    }
  } catch (error) {
    console.error("Error cancelling items:", error);
    Toastify({
      text: error.response?.data?.message || "Failed to cancel items",
      duration: 4000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "linear-gradient(to right, #ef4444, #dc2626)",
    }).showToast();
  }
});

/* -------------------------------------------
   RETURN ORDER MODAL
-------------------------------------------- */
function openReturnOrderModal(order) {
  currentOrderData = order;
  document.getElementById("returnItemOrderId").value = order._id;

  const returnItemsList = document.getElementById("returnItemsList");
  returnItemsList.innerHTML = "";

  order.orderedItems.forEach((item) => {
    if (item.itemStatus === "Delivered") {
      const itemHtml = `
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
          <input type="checkbox" name="returnItems[]" value="${item._id}"
            class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">

          <img src="${item.variantId.images[0]}" 
            alt="${item.productId.name}"
            class="w-12 h-12 object-contain bg-gray-100 rounded">

          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              ${item.productId.name}
            </p>

            <div>${getPriceHtml(item)}</div>
          </div>
        </label>
      `;
      returnItemsList.innerHTML += itemHtml;
    }
  });

  if (!returnItemsList.innerHTML.trim()) {
    returnItemsList.innerHTML =
      '<p class="text-center text-gray-600 py-4">No items available for return</p>';
  }

  document.getElementById("returnItemModal").classList.remove("hidden");
  document.getElementById("returnItemModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeReturnItemModal() {
  document.getElementById("returnItemModal").classList.add("hidden");
  document.getElementById("returnItemModal").classList.remove("flex");
  document.body.style.overflow = "auto";
  document.getElementById("returnItemForm").reset();
}

document.getElementById("returnItemForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const formData = new FormData(this);
  const orderId = formData.get("orderId");
  const returnItems = formData.getAll("returnItems[]");
  const reason = formData.get("reason");
  const comments = formData.get("comments");

  if (returnItems.length === 0) {
    Toastify({
      text: "Please select at least one item to return",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "linear-gradient(to right, #f97316, #f43f5e)",
    }).showToast();
    return;
  }

  try {
    const res = await axios.post(`/order/${orderId}/return-items`, {
      itemIds: returnItems,
      reason,
      comments,
    });

    const data = res.data;
    if (data && data.success) {
      Toastify({
        text: "Return request submitted successfully!",
        duration: 2500,
        gravity: "bottom",
        position: "right",
        backgroundColor: "linear-gradient(to right, #16a34a, #10b981)",
      }).showToast();

      closeReturnItemModal();
      setTimeout(() => window.location.reload(), 800);
    }
  } catch (error) {
    console.error("Error submitting return request:", error);
    Toastify({
      text: error.response?.data?.message || "Failed to submit return request",
      duration: 4000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "linear-gradient(to right, #ef4444, #dc2626)",
    }).showToast();
  }
});

/* -------------------------------------------
   SEARCH, FILTERS, ETC
-------------------------------------------- */
function filterOrders(status) {
  const url = new URL(window.location);
  if (status) url.searchParams.set("status", status);
  else url.searchParams.delete("status");
  url.searchParams.set("page", 1);
  window.location.href = url.href;
}

let searchTimeoutOrder;
function debounceSearchOrder() {
  clearTimeout(searchTimeoutOrder);
  searchTimeoutOrder = setTimeout(handleSearchOrder, 1000);
}

function handleSearchOrder() {
  const searchValue = document.getElementById("orderSearch").value;
  const url = new URL(window.location);
  if (searchValue) url.searchParams.set("searchOrder", searchValue);
  else url.searchParams.delete("searchOrder");
  url.searchParams.set("page", 1);
  window.location.href = url.href;
}

function clearOrderSearch() {
  const orderSearchInput = document.getElementById("orderSearch");
  if (orderSearchInput) orderSearchInput.value = "";
  toggleOrderClearButton();

  const url = new URL(window.location);
  url.searchParams.delete("searchOrder");
  url.searchParams.set("page", 1);
  window.location.href = url.href;
}

function toggleOrderClearButton() {
  const input = document.getElementById("orderSearch");
  const btn = document.getElementById("clear-order-search-btn");
  if (input.value.trim()) btn.classList.remove("hidden");
  else btn.classList.add("hidden");
}

function changeOrderPage(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.location.href = url.href;
}

function trackOrder(orderId) {
  window.location.href = `/order/track/${orderId}`;
}

function downloadInvoice(orderId) {
  window.open(`/order/invoice/${orderId}`, "_blank");
}
