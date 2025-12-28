// ========================================
// RETRY PAYMENT FUNCTION
// ========================================

async function retryPayment(orderId) {
  try {
    // Create a new Razorpay order from backend
    const response = await axios.post(`/order/retry-payment/${orderId}`);
    const data = response.data;
    console.log(data);

    if (!data.success) {
      Toastify({
        text: data.message || "Failed to initiate payment",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#ef4444",
      }).showToast();
      return;
    }

    const { razorpayOrderId, amount, tempOrderId } = data;

    const options = {
      key: window.orderFailureData.razorpayKeyId,
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
  } catch (error) {
    console.error("Error:", error);

    Toastify({
      text: error.response?.data?.message || "Something went wrong",
      duration: 3000,
      gravity: "bottom",
      position: "right",
      backgroundColor: "#ef4444",
    }).showToast();
  }
}

// ========================================
// REDIRECT FUNCTION
// ========================================

async function redirect(href, orderId) {
  try {
    const response = await axios.delete(`/order/delete/temp-order/${orderId}`);

    if (response.data.success) {
      window.location.href = href;
    } else {
      alert("Unable to proceed to checkout!");
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong!");
  }
}
