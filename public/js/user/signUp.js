document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
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
        }, 1200);
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Register user failed ❌",
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
