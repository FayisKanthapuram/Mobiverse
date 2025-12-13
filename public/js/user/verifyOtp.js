document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = document.querySelectorAll(".otp-input");
  const resendLink = document.getElementById("resend-otp-link");

  /* ============================
     OTP INPUT AUTO MOVE
  ============================ */
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value.length === 0 && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  /* ============================
     RESEND OTP CLICK
  ============================ */
  if (resendLink) {
    resendLink.addEventListener("click", async (e) => {
      e.preventDefault();

      // Start countdown and save it in localStorage
      startCountdown();

      try {
        const response = await axios.post("/resendOtp");

        Toastify({
          text: response.data.message,
          duration: 2000,
          gravity: "bottom",
          position: "right",
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();

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
      }
    });
  }

  /* ============================
     COUNTDOWN WITH LOCALSTORAGE
  ============================ */
  function startCountdown() {
    const cooldownEnd = Date.now() + 30000; // 30 sec
    localStorage.setItem("otpCooldownEnd", cooldownEnd);
    runCountdown();
  }

  function runCountdown() {
    const cooldownEnd = localStorage.getItem("otpCooldownEnd");

    if (!cooldownEnd) return; // no timer saved

    const now = Date.now();
    const remaining = Math.floor((cooldownEnd - now) / 1000);

    if (remaining > 0) {
      resendLink.classList.add("disabled");
      resendLink.textContent = `Resend in ${remaining}s`;
      setTimeout(runCountdown, 1000);
    } else {
      resendLink.classList.remove("disabled");
      resendLink.textContent = "Resend OTP";
      localStorage.removeItem("otpCooldownEnd");
    }
  }

  // Run countdown when page loads
  runCountdown();

  /* ============================
     VERIFY OTP SUBMIT
  ============================ */
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const otp = [...document.querySelectorAll(".otp-input")]
      .map((i) => i.value)
      .join("");

    try {
      const response = await axios.post("/verifyOtp", { otp });

      if (response.data.success) {
        Toastify({
          text: response.data.message,
          duration: 500,
          gravity: "bottom",
          position: "right",
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();

        setTimeout(() => {
          window.location.href = response.data.redirect;
        }, 600);
      }

    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Something went wrong",
        duration: 2000,
        gravity: "bottom",
        position: "right",
        style: {
          background: "#e74c3c",
        },
      }).showToast();
    }
  });
});
