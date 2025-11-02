document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const submitBtn = document.querySelector("#sendButton");
    submitBtn.disabled = true;
    submitBtn.textContent = "sending...";

    try {
      const response = await axios.post("/user/forgotPassword", { email });

      if (response.data.success) {
        Toastify({
          text: response.data.message,
          duration: 1000,
          gravity: "top",
          position: "right",
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();
        setTimeout(() => {
          window.location.href = response.data.redirect;
        }, 2000);
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Login failed",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: {
          background: "#e74c3c",
        },
      }).showToast();
    } finally {
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = "Send OTP";
    }
  });
