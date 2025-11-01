document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post("/admin/login", { email, password });

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
      duration: 2000,
      gravity: "top",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  }
});
