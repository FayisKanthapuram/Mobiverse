let editingAddressId = null;

// Open Add Address Modal
function openAddAddressModal() {
  editingAddressId = null;
  document.getElementById("modalTitle").textContent = "Add New Address";
  document.getElementById("addressForm").reset();
  document.getElementById("addressModal").classList.remove("hidden");
  document.getElementById("addressModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

// Close Address Modal
function closeAddressModal() {
  document.getElementById("addressModal").classList.add("hidden");
  document.getElementById("addressModal").classList.remove("flex");
  document.body.style.overflow = "auto";
  editingAddressId = null;
}

// Edit Address
function editAddress(addressData) {
  editingAddressId = addressData._id || addressData.id;
  document.getElementById("modalTitle").textContent = "Edit Address";

  // Populate form with address data
  document.querySelector(
    `input[name="addressType"][value="${addressData.addressType}"]`
  ).checked = true;
  document.getElementById("fullName").value = addressData.fullName;
  document.getElementById("phone").value = addressData.phone;
  document.getElementById("address1").value = addressData.address1;
  document.getElementById("address2").value = addressData.address2 || "";
  document.getElementById("city").value = addressData.city;
  document.getElementById("state").value = addressData.state;
  document.getElementById("pincode").value = addressData.pincode;
  document.getElementById("setDefault").checked =
    addressData.setDefault || false;

  document.getElementById("addressModal").classList.remove("hidden");
  document.getElementById("addressModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

// Delete Address
let deleteAddressId = null;
function openDeleteModal(addressId) {
  deleteAddressId = addressId;
  document.getElementById("deleteConfirmModal").classList.remove("hidden");
  document.getElementById("deleteConfirmModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeDeleteModal() {
  deleteAddressId = null;
  document.getElementById("deleteConfirmModal").classList.add("hidden");
  document.getElementById("deleteConfirmModal").classList.remove("flex");
  document.body.style.overflow = "auto";
}

// Close delete modal on outside click
document
  .getElementById("deleteConfirmModal")
  .addEventListener("click", function (e) {
    if (e.target === this) {
      closeDeleteModal();
    }
  });


document
  .getElementById("confirmDeleteBtn")
  .addEventListener("click", async function () {
    if (!deleteAddressId) return;

    try {
      const response = await axios.delete(`/address/${deleteAddressId}`);
      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.href = "/address";
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Delete address failed",
        duration: 2000,
        gravity: "bottom",
        position: "right",
        style: { background: "#e74c3c" },
      }).showToast();
    } finally {
      closeDeleteModal();
    }
  });

// Set Default Address
async function setDefaultAddress(addressId) {
  try {
    const response = await axios.patch(`/address/${addressId}/set-default`);
    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.href = "/address";
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "set default failed",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  }
}

// Form Submission (with loading state)
document
  .getElementById("addressForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("saveAddressBtn");

    // ⛔ Prevent multiple clicks
    if (submitBtn.disabled) return;

    // 🔄 Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="relative w-5 h-5">
        <span class="absolute inset-0 rounded-full border-2 border-white opacity-30"></span>
        <span class="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
      </span>
      <span>Saving...</span>
    `;


    const formData = new FormData(this);
    const addressData = {
      addressType: formData.get("addressType"),
      fullName: formData.get("fullName"),
      phone: formData.get("phone"),
      address1: formData.get("address1"),
      address2: formData.get("address2"),
      city: formData.get("city"),
      state: formData.get("state"),
      pincode: formData.get("pincode"),
      country: "India",
      setDefault: formData.get("setDefault") === "on",
    };

    try {
      let response;

      if (editingAddressId) {
        response = await axios.put(
          `/address/${editingAddressId}`,
          addressData
        );
      } else {
        response = await axios.post("/address", addressData);
      }

      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.href = "/address";
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Saving address failed",
        duration: 2000,
        gravity: "bottom",
        position: "right",
        style: { background: "#e74c3c" },
      }).showToast();

      // 🔁 Restore button state on error
      submitBtn.disabled = false;
      submitBtn.innerHTML = `
        <i class="bi bi-check-circle"></i>
        <span>Save Address</span>
      `;
    }
  });


// Close modal on outside click
document.getElementById("addressModal").addEventListener("click", function (e) {
  if (e.target === this) {
    closeAddressModal();
  }
});

// Close modal on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key !== "Escape") return;

  const addressModal = document.getElementById("addressModal");
  const deleteModal = document.getElementById("deleteConfirmModal");

  if (!deleteModal.classList.contains("hidden")) {
    closeDeleteModal();
  } else if (!addressModal.classList.contains("hidden")) {
    closeAddressModal();
  }
});
