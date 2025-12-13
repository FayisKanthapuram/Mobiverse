// -------------------------------
// Toastify Helper
// -------------------------------
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

// -------------------------------
// Update Order Status
// -------------------------------
async function updateOrderStatus() {
  const orderId = document.querySelector("[data-order-id]")?.dataset.orderId;
  const newStatus = document.getElementById("statusSelect").value;

  if (!confirm(`Are you sure you want to update status to "${newStatus}"?`))
    return;

  try {
    const res = await axios.patch(`/admin/orders/${orderId}/status`, {
      status: newStatus,
    });

    if (res.data.success) {
      notify("Order status updated successfully!", "success");
      setTimeout(() => window.location.reload(), 800);
    } else {
      notify("Failed to update order status", "error");
    }
  } catch (err) {
    console.error(err);
    notify("Error updating order status", "error");
  }
}



// -------------------------------
// Download Invoice
// -------------------------------
function downloadInvoice() {
  const orderId = document.querySelector("[data-order-id]")?.dataset.orderId;
  window.location.href = `/admin/orders/${orderId}/invoice`;
}

// -------------------------------
// Print Order
// -------------------------------
function printOrder() {
  window.print();
}

// -------------------------------
// Approve / Reject Return Request
// -------------------------------
async function handleReturn(orderId, itemId, action) {
  const adminNote = document
    .getElementById(`adminNote_${itemId}`)
    ?.value.trim();

  if (!confirm(`Are you sure you want to ${action} this return request?`))
    return;

  const btns = document.querySelectorAll(`button[onclick*="${itemId}"]`);
  btns.forEach((b) => (b.disabled = true));

  try {
    const res = await axios.patch(`/admin/orders/${orderId}/return-request`, {
      itemId,
      action,
      adminNote: adminNote || undefined,
    });

    if (res.data.success) {
      notify(res.data.message || `Return ${action}ed successfully`, "success");
      setTimeout(() => window.location.reload(), 800);
    } else {
      notify(res.data.message || "Failed to update request", "error");
      btns.forEach((b) => (b.disabled = false));
    }
  } catch (err) {
    console.error(err);
    notify("Error while processing", "error");
    btns.forEach((b) => (b.disabled = false));
  }
}

// -------------------------------
// Mark Item Returned
// -------------------------------
async function markItemReturned(orderId, itemId, event) {
  if (!confirm("Confirm that you received this returned item?")) return;

  // Support callers that don't pass the event (inline `onclick` may omit it).
  // Prefer the provided event, otherwise try to locate the button by
  // searching for a button whose onclick contains the itemId (used elsewhere).
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
      notify(res.data.message || "Item marked returned", "success");
      setTimeout(() => window.location.reload(), 800);
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
}

// -------------------------------
// Filter Allowed Status Options
// -------------------------------
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

// -------------------------------
// On Page Load
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  filterStatusOptions();

  if (window.location.hash === "#returns") {
    document.querySelector(".return-request-section")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
});
