// Global variables
let selectedAddressId = null;
let selectedPaymentMethod = "razorpay";

// ========================================
// ADDRESS FUNCTIONS
// ========================================

function selectAddress(addressId) {
  selectedAddressId = addressId;
}

function openAddAddressModal() {
  document.getElementById("addressModal").classList.remove("hidden");
  document.getElementById("addressModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeAddressModal() {
  document.getElementById("addressModal").classList.add("hidden");
  document.getElementById("addressModal").classList.remove("flex");
  document.body.style.overflow = "auto";
}

// ========================================
// PAYMENT METHOD FUNCTIONS
// ========================================

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
}

// ========================================
// COUPON FUNCTIONS
// ========================================

function openCouponsModal() {
  document.getElementById("couponsModal").classList.remove("hidden");
  document.getElementById("couponsModal").classList.add("flex");
  document.body.style.overflow = "hidden";
}

function closeCouponsModal() {
  document.getElementById("couponsModal").classList.add("hidden");
  document.getElementById("couponsModal").classList.remove("flex");
  document.body.style.overflow = "auto";
}

async function applyCoupon() {
  const code = document.getElementById("couponCode").value.trim().toUpperCase();
  if (!code) {
    alert("Please enter a coupon code");
    return;
  }

  try {
    const response = await axios.post("/checkout/apply-coupon", {
      code,
      totalAmount: window.checkoutData.cartTotal,
    });

    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.reload();
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Add coupon failed",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  }
}

function applyCouponCode(code) {
  document.getElementById("couponCode").value = code;
  closeCouponsModal();
  applyCoupon();
}

async function removeCoupon() {
  if (!confirm("Remove applied coupon?")) return;

  try {
    const response = await axios.post("/checkout/remove-coupon");
    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.reload();
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Remove coupon failed",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  }
}

// ========================================
// ORDER PLACEMENT FUNCTION
// ========================================

async function placeOrder() {
  // Validate address selection
  const selectedAddress = document.querySelector(
    'input[name="selectedAddress"]:checked'
  );
  if (!selectedAddress) {
    Toastify({
      text: "Please select a delivery address",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#ef4444",
    }).showToast();
    return;
  }

  const totalAmount = window.checkoutData.payableAmount;

  // Validate payment method selection
  const selectedPayment = document.querySelector(
    'input[name="paymentMethod"]:checked'
  );

  // Check COD limit
  if (selectedPayment?.value === "cod" && totalAmount >= 20000) {
    Toastify({
      text: "Cash on Delivery is allowed only for orders below ₹20,000",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#ef4444",
    }).showToast();
    return;
  }

  if (!selectedPayment) {
    Toastify({
      text: "Please select a payment method.",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#ef4444",
    }).showToast();
    return;
  }

  const addressId = selectedAddress.value;
  const paymentMethod = selectedPayment.value;

  // Check wallet balance if wallet selected
  if (paymentMethod === "wallet") {
    const walletBalance = window.checkoutData.walletBalance;
    if (walletBalance < totalAmount) {
      Toastify({
        text: "Insufficient wallet balance. Please select another payment method.",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#ef4444",
      }).showToast();
      return;
    }
  }

  // Disable button to prevent double submission
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  placeOrderBtn.disabled = true;
  placeOrderBtn.innerHTML =
    '<i class="bi bi-hourglass-split"></i> Processing...';

  const orderData = {
    addressId: addressId,
    paymentMethod: paymentMethod,
  };

  try {
    // ========================================
    // RAZORPAY PAYMENT FLOW
    // ========================================
    if (paymentMethod === "razorpay") {
      const response = await axios.post("/order/place", orderData);
      const data = response.data;

      if (!data.success) {
        Toastify({
          text: data.message || "Failed to initiate payment",
          duration: 3000,
          gravity: "bottom",
          position: "right",
          backgroundColor: "#ef4444",
        }).showToast();

        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML =
          '<i class="bi bi-check-circle"></i> Place Order';
        return;
      }

      const { razorpayOrderId, amount, tempOrderId } = data;

      const options = {
        key: window.checkoutData.razorpayKeyId,
        amount,
        currency: "INR",
        order_id: razorpayOrderId,

        handler: async function (payment) {
          try {
            // Verify payment server-side
            const verifyRes = await axios.post("/order/razorpay/verify", {
              ...payment,
              tempOrderId,
            });

            if (verifyRes.data.success) {
              window.location.href = "/order/success/" + verifyRes.data.orderId;
            } else {
              window.location.href = `/order/failure/${tempOrderId}`;
            }
          } catch (error) {
            console.log(error);
            Toastify({
              text: "Payment verification failed!",
              duration: 3000,
              gravity: "bottom",
              position: "right",
              backgroundColor: "#ef4444",
            }).showToast();
          }
        },

        modal: {
          ondismiss: function () {
            Toastify({
              text: "Payment cancelled",
              duration: 3000,
              gravity: "bottom",
              position: "right",
              backgroundColor: "#ef4444",
            }).showToast();
          },
        },
      };

      const rzp = new Razorpay(options);

      rzp.on("payment.failed", function (response) {
        window.location.href = `/order/failure/${tempOrderId}`;
      });

      rzp.open();

      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML =
        '<i class="bi bi-check-circle"></i> Place Order';

      return; // Stop normal flow
    }

    // ========================================
    // WALLET / COD NORMAL ORDER FLOW
    // ========================================
    const response = await axios.post("/order/place", orderData);
    const data = response.data;

    if (data.success) {
      window.location.href = "/order/success/" + data.orderId;
    } else {
      Toastify({
        text: data.message || "Failed to place order",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#ef4444",
      }).showToast();

      placeOrderBtn.disabled = false;
      placeOrderBtn.innerHTML =
        '<i class="bi bi-check-circle"></i> Place Order';
    }
  } catch (error) {
    console.error("Error:", error);

    Toastify({
      text: error.response?.data?.message || "Something went wrong",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#ef4444",
    }).showToast();

    placeOrderBtn.disabled = false;
    placeOrderBtn.innerHTML = '<i class="bi bi-check-circle"></i> Place Order';
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

// Address Form Submit
document
  .getElementById("addressForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const saveBtn = document.getElementById("saveAddressBtn");
    const btnText = document.getElementById("saveAddressText");
    const btnLoader = document.getElementById("saveAddressLoader");

    // 🚫 Prevent multiple submissions
    if (saveBtn.disabled) return;

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

    // 🔒 Lock UI
    saveBtn.disabled = true;
    btnText.classList.add("hidden");
    btnLoader.classList.remove("hidden");

    try {
      const response = await axios.post("/address", addressData);

      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.reload(); // safe because request is done
      }
    } catch (error) {
      // 🔓 Unlock on error
      saveBtn.disabled = false;
      btnText.classList.remove("hidden");
      btnLoader.classList.add("hidden");

      Toastify({
        text: error.response?.data?.message || "Add address failed",
        duration: 2000,
        gravity: "bottom",
        position: "right",
        style: {
          background: "#e74c3c",
        },
      }).showToast();
    }
  });


// Close modals on outside click
document.getElementById("addressModal").addEventListener("click", function (e) {
  if (e.target === this) closeAddressModal();
});

document.getElementById("couponsModal").addEventListener("click", function (e) {
  if (e.target === this) closeCouponsModal();
});

// Close modals on Escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (!document.getElementById("addressModal").classList.contains("hidden")) {
      closeAddressModal();
    }
    if (!document.getElementById("couponsModal").classList.contains("hidden")) {
      closeCouponsModal();
    }
  }
});

// Auto-select default address on page load
window.addEventListener("DOMContentLoaded", function () {
  const defaultAddress = document.querySelector(
    'input[name="selectedAddress"]:checked'
  );
  if (defaultAddress) {
    selectedAddressId = defaultAddress.value;
  }
});
