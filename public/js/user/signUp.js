document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const submitBtn = document.querySelector("#registerBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering...";
    try {
      const response = await axios.post("/user/register", {
        username,
        email,
        password,
        confirmPassword,
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
        duration: 1000,
        gravity: "top",
        position: "right",
        style: {
          background: "#e74c3c",
        },
      }).showToast();
    }finally {
      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign Up";
    }
  });
