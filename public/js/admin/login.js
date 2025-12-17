const successMsg = sessionStorage.getItem("toastSuccess");
const errorMsg = sessionStorage.getItem("toastError");

if (successMsg) {
  Toastify({
    text: successMsg,
    duration: 4000,
    gravity: "bottom",
    position: "right",
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
    close: true,
  }).showToast();

  sessionStorage.removeItem("toastSuccess");
}

if (errorMsg) {
  Toastify({
    text: errorMsg,
    duration: 4000,
    gravity: "bottom",
    position: "right",
    style: {
      background: "#e74c3c",
    },
    close: true,
  }).showToast();

  sessionStorage.removeItem("toastError");
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const response = await axios.post("/admin/login", { email, password });

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

function togglePassword() {
  const password = document.getElementById("password");
  const eyeOpen = document.getElementById("eyeOpen");
  const eyeClosed = document.getElementById("eyeClosed");

  if (password.type === "password") {
    password.type = "text";
    eyeOpen.classList.add("hidden");
    eyeClosed.classList.remove("hidden");
  } else {
    password.type = "password";
    eyeOpen.classList.remove("hidden");
    eyeClosed.classList.add("hidden");
  }
}
