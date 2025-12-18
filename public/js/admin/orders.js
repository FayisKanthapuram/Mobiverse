// Orders Management JavaScript

let searchTimeout;

// Pagination
function changePage(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
}

// Apply Filters
function applyFilters() {
  const url = new URL(window.location);

  const status = document.getElementById("statusFilter").value;
  const paymentStatus = document.getElementById("paymentStatusFilter").value;
  const sort = document.getElementById("sortFilter").value;

  if (status) {
    url.searchParams.set("status", status);
  } else {
    url.searchParams.delete("status");
  }

  if (paymentStatus) {
    url.searchParams.set("paymentStatus", paymentStatus);
  } else {
    url.searchParams.delete("paymentStatus");
  }

  if (sort) {
    url.searchParams.set("sort", sort);
  } else {
    url.searchParams.delete("sort");
  }

  url.searchParams.set("page", 1);
  window.location.href = url.toString();
}

// Search Handler
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById("searchInput").value;
    const url = new URL(window.location);

    if (searchTerm) {
      url.searchParams.set("search", searchTerm);
    } else {
      url.searchParams.delete("search");
    }

    url.searchParams.set("page", 1);
    window.location.href = url.toString();
  }, 500);
}

// Clear search only
function clearSearch() {
  const url = new URL(window.location);
  url.searchParams.delete("search");
  window.location.href = url.toString();
}

// Clear all filters but keep search
function clearAllFilters() {
  const url = new URL(window.location);
  const searchQuery = url.searchParams.get("search");

  url.searchParams.delete("status");
  url.searchParams.delete("paymentStatus");
  url.searchParams.delete("sort");
  url.searchParams.set("page", 1);

  window.location.href = url.toString();
}

// Clear everything (filters + search)
function clearAllFiltersAndSearch() {
  window.location.href = window.location.pathname;
}

// Remove individual filter
function removeFilter(filterType) {
  const url = new URL(window.location);
  url.searchParams.delete(filterType);
  url.searchParams.set("page", 1);
  window.location.href = url.toString();
}

// Export Orders
function exportOrders() {
  window.location.href = "/admin/orders/export";
}

// ============================================
// ORDER DETAILS PAGE FUNCTIONS
// ============================================

// Toastify Helper
function notify(message, type = "info") {
  Toastify({
    text: message,
    duration: 3000,
    gravity: "bottom",
    position: "right",
    backgroundColor:
      type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#3b82f6",
  }).showToast();
}

// Update Order Status
async function updateOrderStatus() {
  const orderId = document.querySelector("[data-order-id]")?.dataset.orderId;
  const newStatus = document.getElementById("statusSelect").value;

  const proceed = async () => {
    try {
      const res = await axios.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });

      if (res.data.success) {
        sessionStorage.setItem(
          "toastSuccess",
          "Order status updated successfully!"
        );
        window.location.reload();
      } else {
        notify("Failed to update order status", "error");
      }
    } catch (err) {
      console.error(err);
      notify("Error updating order status", "error");
    }
  };

  openConfirmModal({
    title: "Update Order Status",
    message: `Are you sure you want to update status to "${newStatus}"?`,
    onConfirm: proceed,
  });

}

// Download Invoice
function downloadInvoice() {
  const orderId = document.querySelector("[data-order-id]")?.dataset.orderId;
  window.location.href = `/admin/orders/${orderId}/invoice`;
}

// Print Order
function printOrder() {
  window.print();
}

// Handle Return Request (Approve/Reject)
async function handleReturn(orderId, itemId, action) {
  const adminNote = document
    .getElementById(`adminNote_${itemId}`)
    ?.value.trim();

  const proceed = async () => {
    const btns = document.querySelectorAll(`button[onclick*="${itemId}"]`);
    btns.forEach((b) => (b.disabled = true));

    try {
      const res = await axios.patch(`/admin/orders/${orderId}/return-request`, {
        itemId,
        action,
        adminNote: adminNote || undefined,
      });

      if (res.data.success) {
        sessionStorage.setItem(
          "toastSuccess",
          res.data.message || `Return ${action}ed successfully`
        );
        window.location.reload();
      } else {
        notify(res.data.message || "Failed to update request", "error");
        btns.forEach((b) => (b.disabled = false));
      }
    } catch (err) {
      console.error(err);
      notify("Error while processing", "error");
      btns.forEach((b) => (b.disabled = false));
    }
  };

  openConfirmModal({
    title: action === "approve" ? "Approve Return" : "Reject Return",
    message: `Are you sure you want to ${action} this return request?`,
    onConfirm: proceed,
  });

}

// Mark Item as Returned
async function markItemReturned(orderId, itemId, event) {
  const proceed = async () => {
    event = event || window.event || undefined;

    let btn = null;
    if (event && event.target) {
      btn = event.target.closest("button");
    }

    if (!btn) {
      btn =
        document.querySelector(`button[onclick*="${itemId}"]`) ||
        document.querySelector(`button[data-item-id="${itemId}"]`);
    }

    const original = btn ? btn.innerHTML : null;
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="bi bi-hourglass-split"></i> Processing...`;
    }

    try {
      const res = await axios.patch(`/admin/orders/${orderId}/mark-returned`, {
        itemId,
      });

      if (res.data.success) {
        sessionStorage.setItem(
          "toastSuccess",
          res.data.message || "Item marked returned"
        );
        window.location.reload();
      } else {
        notify("Failed to mark returned", "error");
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = original;
        }
      }
    } catch (err) {
      console.error(err);
      notify("Error while marking returned", "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
  };

  openConfirmModal({
    title: "Mark as Returned",
    message: "Confirm that you received this returned item?",
    onConfirm: proceed,
  });

}

// Filter Status Options (for order details page)
function filterStatusOptions() {
  const select = document.getElementById("statusSelect");
  if (!select) return;

  const current = select.value;
  const flow = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];
  const currentIndex = flow.indexOf(current);

  [...select.options].forEach((opt) => {
    const i = flow.indexOf(opt.value);
    if (i < currentIndex) opt.remove();
  });

  select.value = current;
}

// On Page Load
document.addEventListener("DOMContentLoaded", () => {
  filterStatusOptions();

  if (window.location.hash === "#returns") {
    document.querySelector(".return-request-section")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
});
