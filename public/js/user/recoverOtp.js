document.addEventListener("DOMContentLoaded", () => {
  const otpInputs = document.querySelectorAll(".otp-input");

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

  const resendLink = document.getElementById("resend-otp-link");

  if (resendLink) {
    resendLink.addEventListener("click", async (e) =>{
      e.preventDefault();
      startCountdown();
      try {
        const response = await axios.post("/resendOtp");
        Toastify({
          text: response.data.message,
          duration: 2000,
          gravity: "top",
          position: "right",
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();
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
      }
    });
  }

  function startCountdown() {
    let secondsLeft = 30;

    resendLink.classList.add("disabled");
    resendLink.textContent = `Resend in ${secondsLeft}s`;

    const countdownInterval = setInterval(() => {
      secondsLeft--;
      resendLink.textContent = `Resend in ${secondsLeft}s`;

      if (secondsLeft <= 0) {
        clearInterval(countdownInterval);
        resendLink.classList.remove("disabled");
        resendLink.textContent = "Resend OTP";
      }
    }, 1000);
  }
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = [...document.querySelectorAll(".otp-input")]
      .map((i) => i.value)
      .join("");

    try {
      const response = await axios.post("/verifyRecoverOtp", { otp });

      if (response.data.success) {
        Toastify({
          text: response.data.message,
          duration: 500,
          gravity: "top",
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
        gravity: "top",
        position: "right",
        style: {
          background: "#e74c3c",
        },
      }).showToast();
    }
  });
});
