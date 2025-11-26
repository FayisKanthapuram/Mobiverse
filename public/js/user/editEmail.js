let newEmailValue = "";
let otpTimer = null;
let timeLeft = 60;

// Step 1: Send OTP
document.getElementById("emailForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newEmail = document.getElementById("newEmail").value.trim();
  const submitButton = document.getElementById("sendOtpBtn");
  submitButton.disabled = true;
  submitButton.textContent = "Sending....";
  try {
    const oldEmail = document.getElementById('oldemail').value;
    const response = await axios.post("/edit-email", {
      newEmail,
      oldEmail,
    });
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

      showStep2(newEmail);
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Change password failed",
      duration: 2000,
      gravity: "top",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = `<i class="bi bi-send"></i> Send Verification Code`;
  }
});

// Show Step 2 (OTP Verification)
function showStep2(email) {
  document.getElementById("step1-form").classList.add("hidden");
  document.getElementById("step2-form").classList.remove("hidden");
  document.getElementById("sentToEmail").textContent = email;

  // Update step indicators
  document
    .getElementById("step1-indicator")
    .classList.remove("bg-blue-600", "text-white");
  document
    .getElementById("step1-indicator")
    .classList.add("bg-green-600", "text-white");
  document.getElementById("step1-indicator").innerHTML =
    '<i class="bi bi-check text-lg"></i>';
  document.getElementById("step1-text").classList.remove("text-blue-600");
  document.getElementById("step1-text").classList.add("text-green-600");

  document.getElementById("step-line").classList.remove("bg-gray-300");
  document.getElementById("step-line").classList.add("bg-blue-600");

  document
    .getElementById("step2-indicator")
    .classList.remove("bg-gray-300", "text-gray-600");
  document
    .getElementById("step2-indicator")
    .classList.add("bg-blue-600", "text-white");
  document.getElementById("step2-text").classList.remove("text-gray-400");
  document.getElementById("step2-text").classList.add("text-blue-600");

  // Focus first OTP input
  document.querySelector(".otp-input").focus();

  // Start timer
  startTimer();
}

// OTP Input Handling
const otpInputs = document.querySelectorAll(".otp-input");

otpInputs.forEach((input, index) => {
  input.addEventListener("input", function (e) {
    const value = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      e.target.value = "";
      return;
    }

    // Move to next input
    if (value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", function (e) {
    // Move to previous on backspace
    if (e.key === "Backspace" && !e.target.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });

  // Handle paste
  input.addEventListener("paste", function (e) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (/^\d+$/.test(pastedData)) {
      pastedData.split("").forEach((char, i) => {
        if (otpInputs[i]) {
          otpInputs[i].value = char;
        }
      });
      otpInputs[Math.min(pastedData.length, 5)].focus();
    }
  });
});

// Verify OTP
document
  .getElementById("otpForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const otp = Array.from(otpInputs)
      .map((input) => input.value)
      .join("");
    const submitButton = document.getElementById("verifyOtpBtn");
    submitButton.disabled = true;
    submitButton.textContent = "Verifying OTP...";
    try {
      const response = await axios.post("/edit-email/otp", {
        otp,
      });

      if (response.data.success) {
        Toastify({
          text: response.data.message,
          duration: 2000,
          gravity: "top",
          position: "right",
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();
        showSuccess();
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
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = `<i class="bi bi-check-circle"></i> Verify & Update Email`;
    }
  });

// Resend OTP
document
  .getElementById("resendOtpBtn")
  .addEventListener("click", async function () {
    if (timeLeft > 0) {
      return;
    }
    otpInputs.forEach((input) => (input.value = ""));
    otpInputs[0].focus();

    // Restart timer
    startTimer();

    try {
      const response = await axios.post("/edit-email/resend-otp");

      if (response.data.success) {
        Toastify({
          text: response.data.message,
          duration: 2000,
          gravity: "top",
          position: "right",
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();
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

// Back Button
document.getElementById("backBtn").addEventListener("click", function () {
  document.getElementById("step2-form").classList.add("hidden");
  document.getElementById("step1-form").classList.remove("hidden");

  // Reset step indicators
  document
    .getElementById("step1-indicator")
    .classList.add("bg-blue-600", "text-white");
  document.getElementById("step1-indicator").classList.remove("bg-green-600");
  document.getElementById("step1-indicator").textContent = "1";
  document.getElementById("step1-text").classList.add("text-blue-600");
  document.getElementById("step1-text").classList.remove("text-green-600");

  document.getElementById("step-line").classList.add("bg-gray-300");
  document.getElementById("step-line").classList.remove("bg-blue-600");

  document
    .getElementById("step2-indicator")
    .classList.add("bg-gray-300", "text-gray-600");
  document
    .getElementById("step2-indicator")
    .classList.remove("bg-blue-600", "text-white");
  document.getElementById("step2-text").classList.add("text-gray-400");
  document.getElementById("step2-text").classList.remove("text-blue-600");

  // Clear timer
  if (otpTimer) {
    clearInterval(otpTimer);
  }

  // Clear OTP inputs
  otpInputs.forEach((input) => (input.value = ""));
});

// Show Success Message
function showSuccess() {
  document.getElementById("step2-form").classList.add("hidden");
  document.getElementById("successMessage").classList.remove("hidden");

  if (otpTimer) {
    clearInterval(otpTimer);
  }
}

// Timer for Resend OTP
function startTimer() {
  timeLeft = 30;
  const resendBtn = document.getElementById("resendOtpBtn");
  const timerDisplay = document.getElementById("timer");

  resendBtn.disabled = true;
  resendBtn.classList.add("opacity-50", "cursor-not-allowed");

  if (otpTimer) {
    clearInterval(otpTimer);
  }

  otpTimer = setInterval(function () {
    timeLeft--;
    timerDisplay.textContent = `Resend code in ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(otpTimer);
      resendBtn.disabled = false;
      resendBtn.classList.remove("opacity-50", "cursor-not-allowed");
      timerDisplay.textContent = "";
    }
  }, 1000);
}
