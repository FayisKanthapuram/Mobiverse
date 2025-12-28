/* ================= REGEX ================= */
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;

/* ================= HELPERS ================= */
function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearError(id) {
  const el = document.getElementById(id);
  el.textContent = "";
  el.classList.add("hidden");
}

function toggleSignupPassword(inputId, openId, closeId) {
  const input = document.getElementById(inputId);
  const open = document.getElementById(openId);
  const close = document.getElementById(closeId);

  if (input.type === "password") {
    input.type = "text";
    open.classList.add("hidden");
    close.classList.remove("hidden");
  } else {
    input.type = "password";
    open.classList.remove("hidden");
    close.classList.add("hidden");
  }
}

/* ================= DOM ================= */
const form = document.getElementById("registerForm");
const btn = document.getElementById("registerBtn");

const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const referralInput = document.getElementById("referralCode");
const termsCheckbox = document.getElementById("terms");

/* ================= FIELD VALIDATORS ================= */
function validateUsername() {
  if (usernameInput.value.trim().length < 3) {
    showError("usernameError", "Username must be at least 3 characters");
    return false;
  }
  clearError("usernameError");
  return true;
}

function validateEmail() {
  if (!/^\S+@\S+\.\S+$/.test(emailInput.value.trim())) {
    showError("emailError", "Enter a valid email address");
    return false;
  }
  clearError("emailError");
  return true;
}

function validatePassword() {
  if (!strongPasswordRegex.test(passwordInput.value)) {
    showError(
      "passwordError",
      "Min 6 chars with uppercase, lowercase, number & symbol"
    );
    return false;
  }
  clearError("passwordError");
  return true;
}

function validateConfirmPassword() {
  if (passwordInput.value !== confirmPasswordInput.value) {
    showError("confirmPasswordError", "Passwords do not match");
    return false;
  }
  clearError("confirmPasswordError");
  return true;
}

function validateReferral() {
  if (
    referralInput.value.trim() &&
    !/^[a-zA-Z0-9]{8}$/.test(referralInput.value.trim())
  ) {
    showError(
      "referralCodeError",
      "Referral code must be 8 alphanumeric characters"
    );
    return false;
  }
  clearError("referralCodeError");
  return true;
}

/* ================= FORM VALIDATION ================= */
function validateSignupForm() {
  let valid = true;

  valid &= validateUsername();
  valid &= validateEmail();
  valid &= validatePassword();
  valid &= validateConfirmPassword();
  valid &= validateReferral();

  if (!termsCheckbox.checked) {
    Toastify({
      text: "You must accept Terms & Conditions",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: { background: "#e74c3c" },
    }).showToast();
    valid = false;
  }

  return Boolean(valid);
}

/* ================= AUTO CLEAR ERRORS ON INPUT ================= */
usernameInput.addEventListener("input", validateUsername);
emailInput.addEventListener("input", validateEmail);
passwordInput.addEventListener("input", () => {
  validatePassword();
  validateConfirmPassword(); // re-check match
});
confirmPasswordInput.addEventListener("input", validateConfirmPassword);
referralInput.addEventListener("input", validateReferral);

/* ================= AUTO REFERRAL ================= */
const ref = new URLSearchParams(window.location.search).get("ref");
if (ref) referralInput.value = ref;

/* ================= SUBMIT ================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateSignupForm()) return;

  btn.disabled = true;
  btn.textContent = "Registering...";

  try {
    const res = await axios.post("/register", {
      username: usernameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value,
      referralCode: referralInput.value.trim() || "",
    });

    if (res.data.success) {
      sessionStorage.setItem("toastSuccess", res.data.message);
      window.location.href = res.data.redirect;
    }
  } catch (err) {
    Toastify({
      text: err.response?.data?.message || "Registration failed ❌",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: { background: "#e74c3c" },
    }).showToast();
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign Up";
  }
});

/* ================= TERMS MODAL (UNCHANGED) ================= */
const overlay = document.getElementById("terms-modal-overlay");
document.getElementById("open-terms-modal").onclick = () => {
  overlay.classList.remove("opacity-0", "invisible");
};
document.getElementById("close-terms-modal").onclick = () => {
  overlay.classList.add("opacity-0", "invisible");
};
overlay.onclick = (e) => {
  if (e.target === overlay) {
    overlay.classList.add("opacity-0", "invisible");
  }
};
