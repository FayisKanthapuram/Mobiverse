document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post("/login", { email, password });
    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.href = response.data.redirect;
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Login failed",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "#e74c3c",
      },
    }).showToast();
  }
});

function toggleUserPassword() {
  const input = document.getElementById("password");
  const eyeOpen = document.getElementById("eyeOpenUser");
  const eyeClosed = document.getElementById("eyeClosedUser");

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
