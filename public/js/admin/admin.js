document.getElementById("logout-button").addEventListener("click", async () => {
  try {
    const responce = await axios.post("/admin/logout");
    if (responce.data.success) {
      sessionStorage.setItem("toastSuccess", responce.data.message);
      window.location.href = responce.data.redirect;
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Logout failed ❌",
      duration: 1000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#e74c3c",
    }).showToast();
  }
});

/* =====================================================
   GLOBAL ADMIN CONFIRM MODAL
===================================================== */

let pendingAction = null;

window.openConfirmModal = function ({ title, message, onConfirm }) {
  const modal = document.getElementById("confirmModal");
  if (!modal) return;

  const titleEl = document.getElementById("confirmTitle");
  const messageEl = document.getElementById("confirmMessage");
  const confirmBtn = document.getElementById("confirmAction");
  const cancelBtn = document.getElementById("cancelConfirm");

  titleEl.textContent = title;
  messageEl.textContent = message;

  pendingAction = onConfirm;

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  cancelBtn.onclick = closeConfirmModal;
  confirmBtn.onclick = () => {
    if (pendingAction) pendingAction();
    closeConfirmModal();
  };
};

window.closeConfirmModal = function () {
  const modal = document.getElementById("confirmModal");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
  pendingAction = null;
};
