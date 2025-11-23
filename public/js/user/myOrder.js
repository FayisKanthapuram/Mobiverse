let currentOrderData = null;

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
  const orderItems = document.querySelectorAll(".order-item");
  const tabs = document.querySelectorAll(".filter-tab");

  // Update active tab
  tabs.forEach((tab) => tab.classList.remove("active"));
  event.target.classList.add("active");

  // Filter orders
  orderItems.forEach((item) => {
    if (status === "all") {
      item.style.display = "block";
    } else {
      const itemStatus = item.getAttribute("data-status");
      // Handle partial statuses
      if (
        status === "Delivered" &&
        (itemStatus === "Delivered" || itemStatus === "Partially Delivered")
      ) {
        item.style.display = "block";
      } else if (
        status === "Cancelled" &&
        (itemStatus === "Cancelled" || itemStatus === "Partially Cancelled")
      ) {
        item.style.display = "block";
      } else if (
        status === "Returned" &&
        (itemStatus === "Returned" || itemStatus === "Partially Returned")
      ) {
        item.style.display = "block";
      } else if (itemStatus === status) {
        item.style.display = "block";
      } else {
        item.style.display = "none";
      }
    }
  });

  // Check if no orders visible
  const visibleOrders = Array.from(orderItems).filter(
    (item) => item.style.display !== "none"
  );
  const ordersList = document.getElementById("ordersList");

  if (visibleOrders.length === 0) {
    const existingEmpty = ordersList.querySelector(".empty-filter-state");
    if (!existingEmpty) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-filter-state text-center py-16";
      emptyState.innerHTML = `
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="bi bi-inbox text-5xl text-gray-400"></i>
        </div>
        <h3 class="text-xl font-semibold text-gray-900 mb-2">No ${
          status !== "all" ? status : ""
        } Orders</h3>
        <p class="text-gray-600">You don't have any ${
          status !== "all" ? status.toLowerCase() : ""
        } orders</p>
      `;
      ordersList.appendChild(emptyState);
    }
  } else {
    const existingEmpty = ordersList.querySelector(".empty-filter-state");
    if (existingEmpty) {
      existingEmpty.remove();
    }
  }
}

// Open Cancel Modal
function openCancelModal(orderId) {
  document.getElementById("cancelOrderId").value = orderId;
  document.getElementById("cancelModal").classList.remove("hidden");
  document.getElementById("cancelModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

// Close Cancel Modal
function closeCancelModal() {
  document.getElementById("cancelModal").classList.add("hidden");
  document.getElementById("cancelModal").classList.remove("flex");
  document.body.style.overflow = "auto";
  document.getElementById("cancelForm").reset();
}

// Cancel Form Submit
document.getElementById("cancelForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const orderId = formData.get("orderId");
  const reason = formData.get("reason");
  const comments = formData.get("comments");

  // TODO: API call to cancel order
  fetch(`/api/order/cancel/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, comments }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Order cancelled successfully!");
        window.location.reload();
      } else {
        alert(data.message || "Failed to cancel order");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to cancel order");
    });
});

// Open Return Modal
function openReturnModal(orderId) {
  document.getElementById("returnOrderId").value = orderId;

  // TODO: Fetch order items that can be returned (Delivered items only)
  fetch(`/api/order/${orderId}/returnable-items`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.items.length > 0) {
        const itemsList = document.getElementById("returnItemsList");
        itemsList.innerHTML = "";

        data.items.forEach((item) => {
          if (item.itemStatus === "Delivered") {
            const itemHtml = `
              <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                <input type="checkbox" name="returnItems[]" value="${item._id}" class="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                <img src="${item.variantId.images[0]}" alt="${item.productId.name}" class="w-12 h-12 object-contain bg-gray-100 rounded">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">${item.productId.name}</p>
                  <p class="text-xs text-gray-600">Qty: ${item.quantity}</p>
                </div>
              </label>
            `;
            itemsList.innerHTML += itemHtml;
          }
        });

        document.getElementById("returnModal").classList.remove("hidden");
        document.getElementById("returnModal").classList.add("flex");
        document.body.style.overflow = "hidden";
      } else {
        alert("No items available for return");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to load returnable items");
    });
}

// Close Return Modal
function closeReturnModal() {
  document.getElementById("returnModal").classList.add("hidden");
  document.getElementById("returnModal").classList.remove("flex");
  document.body.style.overflow = "auto";
  document.getElementById("returnForm").reset();
}

// Return Form Submit
document.getElementById("returnForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const orderId = formData.get("orderId");
  const reason = formData.get("reason");
  const comments = formData.get("comments");
  const returnItems = formData.getAll("returnItems[]");

  if (returnItems.length === 0) {
    alert("Please select at least one item to return");
    return;
  }

  // TODO: API call to submit return request
  fetch(`/api/order/return/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnItems, reason, comments }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Return request submitted successfully!");
        window.location.reload();
      } else {
        alert(data.message || "Failed to submit return request");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Failed to submit return request");
    });
});

// Track Order
function trackOrder(orderId) {
  window.location.href = `/order/track/${orderId}`;
}

// Download Invoice
function downloadInvoice(orderId) {
  window.open(`/order/invoice/${orderId}`, "_blank");
}
