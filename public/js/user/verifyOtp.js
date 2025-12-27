document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = document.querySelectorAll(".otp-input");
  const resendLink = document.getElementById("resend-otp-link");
  const form = document.getElementById("loginForm");

  /* ============================
     OTP PASTE HANDLING
  ============================ */
  otpInputs.forEach((input) => {
    input.addEventListener("paste", (e) => {
      e.preventDefault();

      const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");

      if (!pastedData) return;

      pastedData.split("").forEach((digit, i) => {
        if (otpInputs[i]) {
          otpInputs[i].value = digit;
        }
      });

      const lastIndex = Math.min(pastedData.length, otpInputs.length) - 1;
      otpInputs[lastIndex]?.focus();
    });
  });

  /* ============================
     OTP INPUT AUTO MOVE
  ============================ */
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "");

      if (input.value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  /* ============================
     INITIAL COOLDOWN (FROM SERVER)
     window.OTP_COOLDOWN_END injected via EJS
  ============================ */
  if (window.OTP_COOLDOWN_END) {
    localStorage.setItem("otpCooldownEnd", window.OTP_COOLDOWN_END);
  }

  runCountdown();

  /* ============================
     RESEND OTP CLICK
  ============================ */
  if (resendLink) {
    resendLink.addEventListener("click", async (e) => {
      e.preventDefault();

      if (resendLink.classList.contains("disabled")) return;

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
          text: error.response?.data?.message || "Failed to resend OTP",
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
     COUNTDOWN LOGIC
  ============================ */
  function startCountdown() {
    const cooldownEnd = Date.now() + 30000; // 30 sec
    localStorage.setItem("otpCooldownEnd", cooldownEnd);
    runCountdown();
  }

  function runCountdown() {
    const cooldownEnd = localStorage.getItem("otpCooldownEnd");
    if (!cooldownEnd || !resendLink) return;

    const remaining = Math.floor((cooldownEnd - Date.now()) / 1000);

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

  /* ============================
     VERIFY OTP SUBMIT
  ============================ */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const otp = [...otpInputs].map((i) => i.value).join("");

    if (otp.length !== 6) {
      Toastify({
        text: "Please enter the 6-digit OTP",
        duration: 2000,
        gravity: "bottom",
        position: "right",
        style: { background: "#f39c12" },
      }).showToast();
      return;
    }

    try {
      const response = await axios.post("/verifyOtp", { otp });

      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.href = response.data.redirect;
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Invalid OTP",
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
