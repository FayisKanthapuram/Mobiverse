document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  try {
    const response = await axios.post("/resetPassword", {
      password,
      confirmPassword,
    });

    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.href = response.data.redirect;
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Login failed",
      duration: 1000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
    if (error.response.data.redirect) {
      setTimeout(() => {
        window.location.href = error.response.data.redirect;
      }, 1100);
    }
  }
});


function toggleResetPassword(inputId, eyeOpenId, eyeClosedId) {
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
