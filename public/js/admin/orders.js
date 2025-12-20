// Orders Management JavaScript

let searchTimeout;

// ==========================
// PAGINATION & FILTERS
// ==========================

// Pagination
function changePage(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
}

// Apply Filters
function applyFilters() {
  const url = new URL(window.location);

  const status = document.getElementById("statusFilter")?.value;
  const paymentStatus = document.getElementById("paymentStatusFilter")?.value;
  const sort = document.getElementById("sortFilter")?.value;

  status
    ? url.searchParams.set("status", status)
    : url.searchParams.delete("status");
  paymentStatus
    ? url.searchParams.set("paymentStatus", paymentStatus)
    : url.searchParams.delete("paymentStatus");
  sort ? url.searchParams.set("sort", sort) : url.searchParams.delete("sort");

  url.searchParams.set("page", 1);
  window.location.href = url.toString();
}

// Search Handler
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById("searchInput").value;
    const url = new URL(window.location);

    searchTerm
      ? url.searchParams.set("search", searchTerm)
      : url.searchParams.delete("search");
    url.searchParams.set("page", 1);

    window.location.href = url.toString();
  }, 500);
}

// Clear search
function clearSearch() {
  const url = new URL(window.location);
  url.searchParams.delete("search");
  window.location.href = url.toString();
}

// Clear filters (keep search)
function clearAllFilters() {
  const url = new URL(window.location);
  url.searchParams.delete("status");
  url.searchParams.delete("paymentStatus");
  url.searchParams.delete("sort");
  url.searchParams.set("page", 1);
  window.location.href = url.toString();
}

// Clear everything
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

// ==========================
// ORDER DETAILS PAGE
// ==========================

// Toast helper
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

// ==========================
// ITEM STATUS UPDATE (NEW)
// ==========================
async function updateItemStatus(orderId, itemId) {
  const select = document.querySelector(
    `.item-status-select[data-item-id="${itemId}"]`
  );

  if (!select) return;

  const newStatus = select.value;

  openConfirmModal({
    title: "Update Item Status",
    message: `Are you sure you want to update item status to "${newStatus}"?`,
    onConfirm: async () => {
      try {
        const res = await axios.patch(
          `/admin/orders/${orderId}/items/${itemId}/status`,
          { status: newStatus }
        );

        if (res.data.success) {
          sessionStorage.setItem(
            "toastSuccess",
            "Item status updated successfully"
          );
          window.location.reload();
        } else {
          notify(res.data.message || "Failed to update item", "error");
        }
      } catch (err) {
        console.error(err);
        notify(err.response?.data?.message, "error");
      }
    },
  });
}

// ==========================
// RETURNS HANDLING (UNCHANGED)
// ==========================

// Handle Return Request (Approve / Reject)
async function handleReturn(orderId, itemId, action) {
  const adminNote = document
    .getElementById(`adminNote_${itemId}`)
    ?.value.trim();

  const proceed = async () => {
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
        notify(res.data.message || "Failed to process return", "error");
      }
    } catch (err) {
      console.error(err);
      notify("Error while processing return", "error");
    }
  };

  openConfirmModal({
    title: action === "approve" ? "Approve Return" : "Reject Return",
    message: `Are you sure you want to ${action} this return request?`,
    onConfirm: proceed,
  });
}

// Mark Item as Returned
async function markItemReturned(orderId, itemId) {
  openConfirmModal({
    title: "Mark as Returned",
    message: "Confirm that you received this returned item?",
    onConfirm: async () => {
      try {
        const res = await axios.patch(
          `/admin/orders/${orderId}/mark-returned`,
          { itemId }
        );

        if (res.data.success) {
          sessionStorage.setItem(
            "toastSuccess",
            res.data.message || "Item marked as returned"
          );
          window.location.reload();
        } else {
          notify("Failed to mark item returned", "error");
        }
      } catch (err) {
        console.error(err);
        notify("Error marking item returned", "error");
      }
    },
  });
}

// ==========================
// ON PAGE LOAD
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  // Show success toast after reload
  // const successMsg = sessionStorage.getItem("toastSuccess");
  // if (successMsg) {
  //   notify(successMsg, "success");
  //   sessionStorage.removeItem("toastSuccess");
  // }

  // Scroll to returns if hash exists
  if (window.location.hash === "#returns") {
    document.querySelector(".return-request-section")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
});
