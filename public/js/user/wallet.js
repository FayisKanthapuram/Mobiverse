function openAddMoneyModal() {
  document.getElementById("addMoneyModal").classList.remove("hidden");
  document.getElementById("addMoneyModal").classList.add("flex");
}

function closeAddMoneyModal() {
  document.getElementById("addMoneyModal").classList.add("hidden");
  document.getElementById("addMoneyModal").classList.remove("flex");
  document.getElementById("addMoneyForm").reset();
}

// Set quick amount
function setAmount(amount) {
  document.getElementById("addAmount").value = amount;
}

// Add Money Form Submit
document
  .getElementById("addMoneyForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const amount = parseFloat(formData.get("amount"));

    if (amount < 100 || amount > 50000) {
      Toastify({
        text: "Amount must be between ₹100 and ₹50,000",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#ef4444",
      }).showToast();
      return;
    }

    try {
      const orderRes = await axios.post("/wallet/add-money", { amount });

      const order = orderRes.data.order;
      console.log(order);
      const options = {
        key: window.RAZORPAY_KEY,
        amount: order.amount,
        currency: "INR",
        name: "Mobiverse",
        description: "Test Payment",
        order_id: order.id,


        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: true,
        },

        handler: async function (response) {
          // Verify payment
          const verifyRes = await axios.post("/wallet/verify-payment", {...response,amount:order.amount});
          if (verifyRes.data.success) {
            Toastify({
              text: "Money added successfully!",
              duration: 3000,
              gravity: "bottom",
              position: "right",
              backgroundColor: "#10b981",
            }).showToast();

            closeAddMoneyModal();
            setTimeout(() => window.location.reload(), 1000);
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Error adding money:", error);
      Toastify({
        text: error.response?.data?.message || "Failed to add money",
        duration: 3000,
        gravity: "bottom",
        position: "right",
        backgroundColor: "#ef4444",
      }).showToast();
    }
  });

// Filter transactions
function filterTransactions(type) {
  const url = new URL(window.location.href);
  if (type) {
    url.searchParams.set("type", type);
  } else {
    url.searchParams.delete("type");
  }
  url.searchParams.set("page", "1");
  window.location.href = url.toString();
}

// Pagination
function changeWalletPage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
}
