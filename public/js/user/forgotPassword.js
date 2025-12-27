document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const submitBtn = document.querySelector("#sendButton");
    submitBtn.disabled = true;
    submitBtn.textContent = "sending...";

    try {
      const response = await axios.post("/forgotPassword", { email });

      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.href = response.data.redirect;
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Login failed",
        duration: 2000,
        gravity: "bottom",
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
