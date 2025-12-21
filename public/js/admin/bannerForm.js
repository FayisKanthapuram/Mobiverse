// /public/js/admin/bannerForm.js

let cropper = null;
let currentCropDevice = null;
let croppedImages = {
  desktop: null,
  tablet: null,
  mobile: null,
};

// Color picker sync
const colorPicker = document.getElementById("backgroundColor");
const colorHex = document.getElementById("backgroundColorHex");

if (colorPicker && colorHex) {
  colorPicker.addEventListener("input", (e) => {
    colorHex.value = e.target.value;
  });
}

// Toggle scheduling fields
function toggleScheduling() {
  const isScheduled = document.getElementById("isScheduled").checked;
  const schedulingFields = document.getElementById("schedulingFields");

  if (isScheduled) {
    schedulingFields.classList.remove("hidden");
  } else {
    schedulingFields.classList.add("hidden");
    // Clear scheduling fields
    document.getElementById("scheduledStart").value = "";
    document.getElementById("scheduledEnd").value = "";
  }
}

// Image preview function
function previewImage(event, device) {
  const file = event.target.files[0];
  const preview = document.getElementById(
    `imagePreview${device.charAt(0).toUpperCase() + device.slice(1)}`
  );
  const previewImg = document.getElementById(
    `previewImg${device.charAt(0).toUpperCase() + device.slice(1)}`
  );

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      previewImg.src = e.target.result;
      preview.classList.remove("hidden");

      // Store original image for cropping
      croppedImages[device] = {
        original: e.target.result,
        cropped: null,
        file: file,
      };
    };

    reader.readAsDataURL(file);
  } else {
    preview.classList.add("hidden");
  }
}

// Open crop modal
function openCropModal(device) {
  currentCropDevice = device;
  const modal = document.getElementById("cropModal");
  const cropImage = document.getElementById("cropImage");

  if (!croppedImages[device]) return;

  cropImage.src = croppedImages[device].original;
  modal.classList.remove("hidden");

  // Initialize Cropper.js
  setTimeout(() => {
    if (cropper) {
      cropper.destroy();
    }

    // Set aspect ratio based on device
    let aspectRatio;
    switch (device) {
      case "desktop":
        aspectRatio = 16 / 5; // 1920x600
        break;
      case "tablet":
        aspectRatio = 16 / 7; // 1024x450
        break;
      case "mobile":
        aspectRatio = 16 / 8.3; // 768x400
        break;
      default:
        aspectRatio = NaN; // Free crop
    }

    cropper = new Cropper(cropImage, {
      aspectRatio: aspectRatio,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 1,
      restore: false,
      guides: true,
      center: true,
      highlight: true,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
  }, 100);
}

// Close crop modal
function closeCropModal() {
  const modal = document.getElementById("cropModal");
  modal.classList.add("hidden");

  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

// Rotate crop
function rotateCrop(degree) {
  if (cropper) {
    cropper.rotate(degree);
  }
}

// Flip crop
function flipCrop(direction) {
  if (!cropper) return;

  if (direction === "horizontal") {
    cropper.scaleX(-cropper.getData().scaleX || -1);
  } else {
    cropper.scaleY(-cropper.getData().scaleY || -1);
  }
}

// Apply crop
function applyCrop() {
  if (!cropper || !currentCropDevice) return;

  const canvas = cropper.getCroppedCanvas({
    maxWidth:
      currentCropDevice === "desktop"
        ? 1920
        : currentCropDevice === "tablet"
        ? 1024
        : 768,
    maxHeight:
      currentCropDevice === "desktop"
        ? 600
        : currentCropDevice === "tablet"
        ? 450
        : 400,
    fillColor: "#fff",
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  canvas.toBlob((blob) => {
    const croppedDataUrl = canvas.toDataURL();
    croppedImages[currentCropDevice].cropped = croppedDataUrl;

    // Update preview
    const previewImg = document.getElementById(
      `previewImg${
        currentCropDevice.charAt(0).toUpperCase() + currentCropDevice.slice(1)
      }`
    );
    previewImg.src = croppedDataUrl;

    // Convert blob to file for upload
    const file = new File([blob], croppedImages[currentCropDevice].file.name, {
      type: croppedImages[currentCropDevice].file.type,
      lastModified: Date.now(),
    });

    croppedImages[currentCropDevice].file = file;

    closeCropModal();

    Toastify({
      text: "Image cropped successfully",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: {
        background: "linear-gradient(to right, #00b09b, #96c93d)",
      },
      close: true,
    }).showToast();
  });
}

// Handle form submission
const bannerForm = document.getElementById("banner-form");
const isEditMode = window.location.pathname.includes("/edit/");
const bannerId = isEditMode ? window.location.pathname.split("/").pop() : null;

bannerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData();

  // Add text fields
  formData.append("title", document.getElementById("title").value);
  formData.append("subtitle", document.getElementById("subtitle").value);
  formData.append("link", document.getElementById("link").value);
  formData.append(
    "backgroundColor",
    document.getElementById("backgroundColor").value
  );
  formData.append("order", document.getElementById("order").value);
  formData.append("isActive", document.getElementById("isActive").checked);

  // Add scheduling fields
  const isScheduled = document.getElementById("isScheduled").checked;
  formData.append("isScheduled", isScheduled);

  if (isScheduled) {
    const scheduledStart = document.getElementById("scheduledStart").value;
    const scheduledEnd = document.getElementById("scheduledEnd").value;

    if (scheduledStart) {
      formData.append("scheduledStart", new Date(scheduledStart).toISOString());
    }
    if (scheduledEnd) {
      formData.append("scheduledEnd", new Date(scheduledEnd).toISOString());
    }
  }

  // Add image files (use cropped versions if available)
  ["desktop", "tablet", "mobile"].forEach((device) => {
    const input = document.getElementById(
      `image${device.charAt(0).toUpperCase() + device.slice(1)}`
    );

    if (input.files.length > 0) {
      if (croppedImages[device] && croppedImages[device].file) {
        formData.append(
          `image${device.charAt(0).toUpperCase() + device.slice(1)}`,
          croppedImages[device].file
        );
      } else {
        formData.append(
          `image${device.charAt(0).toUpperCase() + device.slice(1)}`,
          input.files[0]
        );
      }
    }
  });

  try {
    let response;

    if (isEditMode) {
      // Update existing banner
      response = await axios.put(`/admin/banners/${bannerId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } else {
      // Create new banner
      response = await axios.post("/admin/banners", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    if (response.data.success) {
      sessionStorage.setItem(
        "toastSuccess",
        `Banner ${isEditMode ? "updated" : "created"} successfully`
      );
      window.location.href = "/admin/banners";
    }
  } catch (error) {
    console.error("Error saving banner:", error);

    let errorMessage = "Failed to save banner";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      // Handle validation errors
      const errors = error.response.data.errors;
      errorMessage = Object.values(errors)
        .map((err) => err.message)
        .join(", ");
    }

    Toastify({
      text: errorMessage,
      duration: 4000,
      gravity: "bottom",
      position: "right",
      style: { background: "#e74c3c" },
      close: true,
    }).showToast();
  }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // If editing and scheduling is enabled, show fields
  const isScheduledCheckbox = document.getElementById("isScheduled");
  if (isScheduledCheckbox && isScheduledCheckbox.checked) {
    toggleScheduling();
  }
});
