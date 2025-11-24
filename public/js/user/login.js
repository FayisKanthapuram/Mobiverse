document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post("/login", { email, password });
    console.log(response);
    if (response.data.success) {
      window.location.href = "/home?message=login-success";
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

const urlParams = new URLSearchParams(window.location.search);
const error = urlParams.get("error");

if (error === "blocked") {
  Toastify({
    text: "Your account is currently blocked. Please contact the admin for assistance.",
    duration: 4000,
    gravity: "top", // top or bottom
    position: "right", // left, center, right
    backgroundColor: "#e63946",
    close: true,
    stopOnFocus: true,
  }).showToast();
}

if (error === "login") {
  Toastify({
    text: "You need to log in to continue",
    duration: 4000,
    gravity: "top", // top or bottom
    position: "right", // left, center, right
    backgroundColor: "#e63946",
    close: true,
    stopOnFocus: true,
  }).showToast();
}

if (error === "logout") {
  Toastify({
    text: "Logged out successfully.",
    duration: 4000,
    gravity: "top", // top or bottom
    position: "right", // left, center, right
    backgroundColor: "#e63946",
    close: true,
    stopOnFocus: true,
  }).showToast();
}

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
