document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  try {
    const response = await axios.post("/user/resetPassword", {
      password,
      confirmPassword,
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
        window.location.href = response.data.redirect;
      }, 600);
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Login failed",
      duration: 1000,
      gravity: "top",
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
