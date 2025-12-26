document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateSignupForm()) return;

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const referralCode =
      document.getElementById("referralCode").value.trim() || '';
    const submitBtn = document.querySelector("#registerBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";
    try {
      const response = await axios.post("/register", {
        username,
        email,
        password,
        confirmPassword,
        referralCode
      });
      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.href = response.data.redirect;
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Register user failed ❌",
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
      submitBtn.textContent = "Sign Up";
    }
  });

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("open-terms-modal");
  const closeBtn = document.getElementById("close-terms-modal");
  const overlay = document.getElementById("terms-modal-overlay");

  if (openBtn && closeBtn && overlay) {
    // Open
    openBtn.addEventListener("click", () => {
      overlay.classList.remove("opacity-0", "invisible");
      overlay.children[0].classList.remove("scale-90");
      overlay.children[0].classList.add("scale-100");
    });

    // Close
    const closeModal = () => {
      overlay.classList.add("opacity-0", "invisible");
      overlay.children[0].classList.add("scale-90");
    };

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }
});

function toggleSignupPassword(inputId, eyeOpenId, eyeClosedId) {
  const input = document.getElementById(inputId);
  const eyeOpen = document.getElementById(eyeOpenId);
  const eyeClosed = document.getElementById(eyeClosedId);

  if (input.type === "password") {
    input.type = "text";
    eyeOpen.classList.add("hidden");
    eyeClosed.classList.remove("hidden");
  } else {
    input.type = "password";
    eyeOpen.classList.remove("hidden");
    eyeClosed.classList.add("hidden");
  }
}

const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get("ref");

// If referral exists, set it automatically
if (ref) {
  document.getElementById("referralCode").value = ref;
}


const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearError(id) {
  const el = document.getElementById(id);
  el.textContent = "";
  el.classList.add("hidden");
}

function validateSignupForm() {
  let isValid = true;

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const referralCode = document.getElementById("referralCode").value.trim();

  // Username
  if (username.length < 3) {
    showError("usernameError", "Username must be at least 3 characters");
    isValid = false;
  } else {
    clearError("usernameError");
  }

  // Email
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    showError("emailError", "Enter a valid email address");
    isValid = false;
  } else {
    clearError("emailError");
  }

  // Password
  if (!strongPasswordRegex.test(password)) {
    showError(
      "passwordError",
      "Password must contain uppercase, lowercase, number & special character"
    );
    isValid = false;
  } else {
    clearError("passwordError");
  }

  // Confirm Password
  if (password !== confirmPassword) {
    showError("confirmPasswordError", "Passwords do not match");
    isValid = false;
  } else {
    clearError("confirmPasswordError");
  }

  // Referral Code (optional)
  if (referralCode && !/^[a-zA-Z0-9]{8}$/.test(referralCode)) {
    showError(
      "referralCodeError",
      "Referral code must be 8 alphanumeric characters"
    );
    isValid = false;
  } else {
    clearError("referralCodeError");
  }

  return isValid;
}
