let currentOrderData = null;

// DOM Content Loaded - Initialize event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Show/Hide Clear Button on Input
  const orderSearchInput = document.getElementById("orderSearch");
  if (orderSearchInput) {
    orderSearchInput.addEventListener("input", toggleOrderClearButton);
  }

  // Initial check for clear button visibility
  toggleOrderClearButton();
});

// Open Cancel Order Modal with item selection
function openCancelOrderModal(order) {
  currentOrderData = order;
  document.getElementById("cancelItemOrderId").value = order._id;

  // Populate cancellable items
  const cancelItemsList = document.getElementById("cancelItemsList");
  cancelItemsList.innerHTML = "";

  order.orderedItems.forEach((item) => {
    if (["Pending", "Confirmed", "Processing"].includes(item.itemStatus)) {
      const itemHtml = `
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
          <input type="checkbox" name="cancelItems[]" value="${
            item._id
          }" class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
          <img src="${item.variantId.images[0]}" alt="${
        item.productId.name
      }" class="w-12 h-12 object-contain bg-gray-100 rounded">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">${
              item.productId.name
            }</p>
            <p class="text-xs text-gray-600">Qty: ${item.quantity} • ₹${(
        item.price * item.quantity
      ).toLocaleString("en-IN")}</p>
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

// Close Cancel Item Modal
function closeCancelItemModal() {
  document.getElementById("cancelItemModal").classList.add("hidden");
  document.getElementById("cancelItemModal").classList.remove("flex");
  document.body.style.overflow = "auto";
  document.getElementById("cancelItemForm").reset();
}

// Cancel Items Form Submit
document
  .getElementById("cancelItemForm")
  .addEventListener("submit", async function (e) {
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
          gravity: "top",
          position: "right",
          backgroundColor: "linear-gradient(to right, #16a34a, #10b981)",
        }).showToast();

        // close modal and refresh after short delay so user sees toast
        if (typeof closeCancelItemModal === "function") closeCancelItemModal();
        setTimeout(() => window.location.reload(), 800);
      }
    } catch (error) {
      console.error("Error cancelling items:", error);
      Toastify({
        text: error.response?.data?.message || "Failed to cancel items",
        duration: 4000,
        gravity: "top",
        position: "right",
        backgroundColor: "linear-gradient(to right, #ef4444, #dc2626)",
      }).showToast();
    }
  });

// Open Return Order Modal with item selection
function openReturnOrderModal(order) {
  currentOrderData = order;
  document.getElementById("returnItemOrderId").value = order._id;

  // Populate returnable items
  const returnItemsList = document.getElementById("returnItemsList");
  returnItemsList.innerHTML = "";

  order.orderedItems.forEach((item) => {
    if (item.itemStatus === "Delivered") {
      const itemHtml = `
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
          <input type="checkbox" name="returnItems[]" value="${
            item._id
          }" class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
          <img src="${item.variantId.images[0]}" alt="${
        item.productId.name
      }" class="w-12 h-12 object-contain bg-gray-100 rounded">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">${
              item.productId.name
            }</p>
            <p class="text-xs text-gray-600">Qty: ${item.quantity} • ₹${(
        item.price * item.quantity
      ).toLocaleString("en-IN")}</p>
          </div>
        </label>
      `;
      returnItemsList.innerHTML += itemHtml;
    }
  });

  if (returnItemsList.innerHTML === "") {
    returnItemsList.innerHTML =
      '<p class="text-center text-gray-600 py-4">No items available for return</p>';
  }

  document.getElementById("returnItemModal").classList.remove("hidden");
  document.getElementById("returnItemModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

// Close Return Item Modal
function closeReturnItemModal() {
  document.getElementById("returnItemModal").classList.add("hidden");
  document.getElementById("returnItemModal").classList.remove("flex");
  document.body.style.overflow = "auto";
  document.getElementById("returnItemForm").reset();
}

// Return Items Form Submit
document
  .getElementById("returnItemForm")
  .addEventListener("submit", async function (e) {
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
        gravity: "top",
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
          gravity: "top",
          position: "right",
          backgroundColor: "linear-gradient(to right, #16a34a, #10b981)",
        }).showToast();

        if (typeof closeReturnItemModal === "function") closeReturnItemModal();
        setTimeout(() => window.location.reload(), 800);
      } else {
        Toastify({
          text: (data && data.message) || "Failed to submit return request",
          duration: 4000,
          gravity: "top",
          position: "right",
          backgroundColor: "linear-gradient(to right, #ef4444, #dc2626)",
        }).showToast();
      }
    } catch (error) {
      console.error("Error submitting return request:", error);
      Toastify({
        text:
          error.response?.data?.message || "Failed to submit return request",
        duration: 4000,
        gravity: "top",
        position: "right",
        backgroundColor: "linear-gradient(to right, #ef4444, #dc2626)",
      }).showToast();
    }
  });

// Filter Orders
function filterOrders(status) {
  const url = new URL(window.location);
  if (status) {
    url.searchParams.set("status", status);
  } else {
    url.searchParams.delete('status');
  }
  url.searchParams.set('page', 1);
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
  if (searchValue) {
    url.searchParams.set("searchOrder", searchValue);
  } else {
    url.searchParams.delete("searchOrder");
  }
  url.searchParams.set('page', 1);
  window.location.href = url.href;
}

// Clear Order Search
function clearOrderSearch() {
  const orderSearchInput = document.getElementById("orderSearch");
  if (orderSearchInput) {
    orderSearchInput.value = "";
  }

  // Hide clear button
  toggleOrderClearButton();

  // Redirect to remove search parameter
  const url = new URL(window.location);
  url.searchParams.delete("searchOrder");
  url.searchParams.set('page', 1);
  window.location.href = url.href;
}

// Toggle Clear Button Visibility
function toggleOrderClearButton() {
  const orderSearchInput = document.getElementById("orderSearch");
  const clearBtn = document.getElementById("clear-order-search-btn");

  if (orderSearchInput && clearBtn) {
    if (orderSearchInput.value.trim()) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  }
}

function changeOrderPage(page) {
  const url = new URL(window.location);
  if (page) {
    url.searchParams.set('page', page);
  } else {
    url.searchParams.delete('page');
  }
  window.location.href = url.href;
}

// Track Order
function trackOrder(orderId) {
  window.location.href = `/order/track/${orderId}`;
}

// Download Invoice
function downloadInvoice(orderId) {
  window.open(`/order/invoice/${orderId}`, "_blank");
}