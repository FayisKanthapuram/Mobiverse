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
async function deleteAddress(addressId) {
  if (confirm("Are you sure you want to delete this address?")) {
    try {
      const response = await axios.delete(`/address/${addressId}`);
      if (response.data.success) {
        window.location.href = "/address?message=delete-address";
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
}

// Set Default Address
async function setDefaultAddress(addressId) {
  try {
    const response = await axios.patch(`/address/${addressId}/set-default`);
    if (response.data.success) {
      window.location.href = "/address?message=default-address";
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

// Form Submission
document
  .getElementById("addressForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

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
      country: "India", // Fixed to India
      setDefault: formData.get("setDefault") === "on",
    };

    console.log(addressData);

    if (editingAddressId) {
      try {
        const response = await axios.put(
          `/address/${editingAddressId}`,
          addressData
        );
        if (response.data.success) {
          window.location.href = "/address?message=address-edit";
        }
      } catch (error) {
        Toastify({
          text: error.response?.data?.message || "edit address failed",
          duration: 2000,
          gravity: "bottom",
          position: "right",
          style: {
            background: "#e74c3c",
          },
        }).showToast();
      }
    } else {
      try {
        const response = await axios.post("/address", addressData);
        if (response.data.success) {
          window.location.href = "/address?message=address-add";
        }
      } catch (error) {
        Toastify({
          text: error.response?.data?.message || "add address failed",
          duration: 2000,
          gravity: "bottom",
          position: "right",
          style: {
            background: "#e74c3c",
          },
        }).showToast();
      }
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
  if (
    e.key === "Escape" &&
    !document.getElementById("addressModal").classList.contains("hidden")
  ) {
    closeAddressModal();
  }
});

const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get("message");
let text = "";
if (message === "address-add") {
  text = "The address has been added successfully.";
} else if (message === "address-edit") {
  text = "The address has been edited successfully.";
} else if (message === "default-address") {
  text = "default address updated successfully";
}else if(message==="delete-address"){
  text="address is deleted successfully."
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
