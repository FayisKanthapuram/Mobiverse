// Toggle password visibility
function togglePassword(fieldId) {
  const field = document.getElementById(fieldId);
  const icon = document.getElementById(fieldId + "-icon");

  if (field.type === "password") {
    field.type = "text";
    icon.classList.remove("bi-eye");
    icon.classList.add("bi-eye-slash");
  } else {
    field.type = "password";
    icon.classList.remove("bi-eye-slash");
    icon.classList.add("bi-eye");
  }
}

// Password strength validation
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");

newPasswordInput.addEventListener("input", function () {
  const password = this.value;

  // Check length
  updateCheck("length-check", password.length >= 8);

  // Check uppercase
  updateCheck("uppercase-check", /[A-Z]/.test(password));

  // Check lowercase
  updateCheck("lowercase-check", /[a-z]/.test(password));

  // Check number
  updateCheck("number-check", /[0-9]/.test(password));

  // Check password match if confirm field has value
  if (confirmPasswordInput.value) {
    checkPasswordMatch();
  }
});

confirmPasswordInput.addEventListener("input", checkPasswordMatch);

function updateCheck(elementId, isValid) {
  const element = document.getElementById(elementId);
  const icon = element.querySelector("i");
  const text = element.querySelector("span");

  if (isValid) {
    icon.classList.remove("bi-circle", "text-gray-400");
    icon.classList.add("bi-check-circle-fill", "text-green-600");
    text.classList.remove("text-gray-500");
    text.classList.add("text-green-600");
  } else {
    icon.classList.remove("bi-check-circle-fill", "text-green-600");
    icon.classList.add("bi-circle", "text-gray-400");
    text.classList.remove("text-green-600");
    text.classList.add("text-gray-500");
  }
}

function checkPasswordMatch() {
  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  const errorMsg = document.getElementById("password-match-error");

  if (confirmPassword && newPassword !== confirmPassword) {
    errorMsg.classList.remove("hidden");
    confirmPasswordInput.classList.add("border-red-500");
  } else {
    errorMsg.classList.add("hidden");
    confirmPasswordInput.classList.remove("border-red-500");
  }
}

// Form validation
document
  .getElementById("changePasswordForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const userId = e.target.dataset.userId;
    console.log(userId);

    try {
      const response = await axios.post("/update-password", {
        currentPassword,
        newPassword,
        confirmPassword,
        userId,
      });

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
          window.location.href = "/personal-info";
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
