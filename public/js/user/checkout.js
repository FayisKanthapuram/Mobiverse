const urlParams = new URLSearchParams(window.location.search);
const message = urlParams.get("message");
let text = "";

if (message === "coupon-add") {
  text = "Coupon applied successfully";
} else if (message === "address-add") {
  text = "New address added successfully.";
} else if (message === "coupon-remove") {
  text = "Coupon removed successfully";
}

if (message) {
  Toastify({
    text,
    duration: 4000,
    gravity: "bottom", // top or bottom
    position: "right", // left, center, right
    style: {
      background: "linear-gradient(to right, #00b09b, #96c93d)",
    },
    close: true,
    stopOnFocus: true,
  }).showToast();
}
