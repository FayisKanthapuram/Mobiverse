// --------------------------------------
// 🌐 Modal Overlay Handling
// --------------------------------------
const modalOverlay = document.getElementById("modal-overlay");

function openModal(modal) {
  if (!modal) return;
  modal.classList.add("active");
  modalOverlay.classList.add("active");
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove("active");
  modalOverlay.classList.remove("active");
}

// Close buttons (X or Cancel)
document.querySelectorAll("[data-close-target]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const modal = document.querySelector(btn.dataset.closeTarget);
    closeModal(modal);
  });
});

// Close modal by clicking overlay
modalOverlay.addEventListener("click", () => {
  document
    .querySelectorAll(".modal-admin.active")
    .forEach((m) => closeModal(m));
});

// --------------------------------------
// ➕ Add Brand Modal
// --------------------------------------
const addModal = document.getElementById("add-brand-modal");
const openAddModalBtn = document.getElementById("open-add-modal-btn");
openAddModalBtn.addEventListener("click", () => openModal(addModal));

// --------------------------------------
// 🖼️ Add Brand - File Cropper Logic
// --------------------------------------
const fileInput = document.getElementById("brandLogoAdd");
const uploadContainer = document.getElementById("uploadContainer");
const placeholder = document.getElementById("uploadPlaceholder");
const preview = document.getElementById("uploadPreview");
const croppedImagePreview = document.getElementById("croppedImagePreview");

const cropperModal = document.getElementById("cropperModal");
const cropperImage = document.getElementById("cropperImage");
const cancelCropBtn = document.getElementById("cancelCropBtn");
const applyCropBtn = document.getElementById("applyCropBtn");
const changeImageBtn = document.getElementById("changeImageBtn");

let cropper;

uploadContainer.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "svg") {
    const reader = new FileReader();
    reader.onload = (event) => {
      croppedImagePreview.src = event.target.result;
      preview.classList.remove("hidden");
      preview.classList.add("flex");
      placeholder.style.display = "none";
    };
    reader.readAsDataURL(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    cropperImage.src = event.target.result;
    cropperModal.classList.add("active");
    cropperImage.onload = () => {
      if (cropper) cropper.destroy();
      cropper = new Cropper(cropperImage, {
        viewMode: 1,
        autoCropArea: 1,
        background: false,
        responsive: true,
      });
    };
  };
  reader.readAsDataURL(file);
});

cancelCropBtn.addEventListener("click", () => {
  cropperModal.classList.remove("active");
  if (cropper) cropper.destroy();
  cropper = null;
  fileInput.value = "";
});

applyCropBtn.addEventListener("click", () => {
  if (!cropper) return;
  const canvas = cropper.getCroppedCanvas({ imageSmoothingQuality: "high" });

  canvas.toBlob((blob) => {
    const croppedUrl = canvas.toDataURL("image/png");
    croppedImagePreview.src = croppedUrl;
    preview.classList.remove("hidden");
    preview.classList.add("flex");
    placeholder.style.display = "none";
    cropperModal.classList.remove("active");

    const originalName = fileInput.files[0].name;
    const baseName =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    const croppedFile = new File([blob], baseName + ".png", {
      type: "image/png",
      lastModified: Date.now(),
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(croppedFile);
    fileInput.files = dataTransfer.files;
  });

  cropper.destroy();
  cropper = null;
});

changeImageBtn.addEventListener("click", () => {
  preview.classList.add("hidden");
  preview.classList.remove("flex");
  placeholder.style.display = "block";
  fileInput.value = "";
});

// --------------------------------------
// 🧾 Add Brand Submit (Axios)
// --------------------------------------
document
  .getElementById("add-brand-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
    e.target.classList.add("disabled-form");

    const formData = new FormData(e.target);

    try {
      const response = await axios.post("/admin/brands/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.reload();
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Failed to add brand",
        duration: 2000,
        gravity: "bottom",
        position: "right",
        style: { background: "#e74c3c" },
      }).showToast();
    } finally {
      e.target.classList.remove("disabled-form");
      submitBtn.disabled = false;
      submitBtn.textContent = "Save";
    }
  });

// --------------------------------------
// ✏️ Edit Brand Modal + populate
// --------------------------------------
const editModal = document.getElementById("edit-brand-modal");
const editForm = document.getElementById("edit-brand-form");
const editBrandId = document.getElementById("editBrandId");
const editBrandName = document.getElementById("editBrandName");
const croppedImagePreviewEdit = document.getElementById(
  "croppedImagePreviewEdit"
);
const uploadPreviewEdit = document.getElementById("uploadPreviewEdit");
const uploadPlaceholderEdit = document.getElementById("uploadPlaceholderEdit");

document.querySelectorAll(".open-edit-modal-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const brandId = e.currentTarget.dataset.brandId;
    try {
      const response = await axios.get(`/admin/brands/${brandId}`);
      populateEditModal(response.data.brand);
      openModal(editModal);
    } catch (error) {
      console.error("Failed to fetch brand data:", error);
      Toastify({
        text: "Could not load brand data. Please try again.",
        duration: 2000,
        gravity: "bottom",
        position: "right",
        style: { background: "#e74c3c" },
      }).showToast();
    }
  });
});

const populateEditModal = (brand) => {
  editBrandId.value = brand._id;
  editBrandName.value = brand.brandName;
  croppedImagePreviewEdit.src = brand.logo;
  uploadPreviewEdit.classList.remove("hidden");
  uploadPreviewEdit.classList.add("flex");
  uploadPlaceholderEdit.style.display = "none";
};

// --------------------------------------
// 🖼️ Edit Brand - File Cropper Logic
// --------------------------------------
const fileInputEditCrop = document.getElementById("brandLogoEdit");
const uploadContainerEdit = document.getElementById("uploadContainerEdit");
const placeholderEdit = document.getElementById("uploadPlaceholderEdit");
const previewEditCrop = document.getElementById("uploadPreviewEdit");
const cropperModalEdit = document.getElementById("cropperModalEdit");
const cropperImageEdit = document.getElementById("cropperImageEdit");
const cancelCropBtnEdit = document.getElementById("cancelCropBtnEdit");
const applyCropBtnEdit = document.getElementById("applyCropBtnEdit");
const changeImageBtnEdit = document.getElementById("changeImageBtnEdit");

let cropperEdit;

uploadContainerEdit.addEventListener("click", () => fileInputEditCrop.click());

fileInputEditCrop.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "svg") {
    const reader = new FileReader();
    reader.onload = (event) => {
      croppedImagePreviewEdit.src = event.target.result;
      previewEditCrop.classList.remove("hidden");
      previewEditCrop.classList.add("flex");
      placeholderEdit.style.display = "none";
    };
    reader.readAsDataURL(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    cropperImageEdit.src = event.target.result;
    cropperModalEdit.classList.add("active");
    cropperImageEdit.onload = () => {
      if (cropperEdit) cropperEdit.destroy();
      cropperEdit = new Cropper(cropperImageEdit, {
        viewMode: 1,
        autoCropArea: 1,
        background: true,
        responsive: true,
      });
    };
  };
  reader.readAsDataURL(file);
});

cancelCropBtnEdit.addEventListener("click", () => {
  cropperModalEdit.classList.remove("active");
  if (cropperEdit) cropperEdit.destroy();
  cropperEdit = null;
  fileInputEditCrop.value = "";
});

applyCropBtnEdit.addEventListener("click", () => {
  if (!cropperEdit) return;
  const canvas = cropperEdit.getCroppedCanvas({
    imageSmoothingQuality: "high",
  });

  canvas.toBlob((blob) => {
    const croppedUrl = canvas.toDataURL("image/png");
    croppedImagePreviewEdit.src = croppedUrl;
    previewEditCrop.classList.remove("hidden");
    previewEditCrop.classList.add("flex");
    placeholderEdit.style.display = "none";
    cropperModalEdit.classList.remove("active");

    const originalName = fileInputEditCrop.files[0].name;
    const baseName =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    const croppedFile = new File([blob], baseName + ".png", {
      type: "image/png",
      lastModified: Date.now(),
    });

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(croppedFile);
    fileInputEditCrop.files = dataTransfer.files;
  });

  cropperEdit.destroy();
  cropperEdit = null;
});

changeImageBtnEdit.addEventListener("click", () => {
  previewEditCrop.classList.add("hidden");
  previewEditCrop.classList.remove("flex");
  placeholderEdit.style.display = "block";
  fileInputEditCrop.value = "";
});

// --------------------------------------
// 🧾 Edit Brand Submit (Axios)
// --------------------------------------
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = e.target.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";
  e.target.classList.add("disabled-form");

  const formData = new FormData(e.target);

  try {
    const response = await axios.patch(`/admin/brands/edit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.reload();
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Failed to update brand",
      duration: 2000,
      gravity: "bottom",
      position: "right",
      style: { background: "#e74c3c" },
    }).showToast();
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Changes";
    e.target.classList.remove("disabled-form");
  }
});

// --------------------------------------
//  List / Unlist Brand (with global modal)
// --------------------------------------
document.querySelectorAll(".btn-unlist, .btn-list").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();

    const brandId = btn.dataset.brandId;
    const isListed = btn.dataset.brandIslisted === "true";

    const proceed = async () => {
      try {
        const response = await axios.patch(
          `/admin/brands/list/${brandId}`
        );

        if (response.data.success) {
          btn.dataset.brandIslisted = (!isListed).toString();

          if (isListed) {
            // → UNLIST
            btn.textContent = "List";
            btn.classList.remove(
              "text-red-600",
              "border-red-300",
              "hover:bg-red-600"
            );
            btn.classList.add(
              "text-green-600",
              "border-green-300",
              "hover:bg-green-600"
            );
            btn.classList.remove("btn-unlist");
            btn.classList.add("btn-list");
          } else {
            // → LIST
            btn.textContent = "Unlist";
            btn.classList.remove(
              "text-green-600",
              "border-green-300",
              "hover:bg-green-600"
            );
            btn.classList.add(
              "text-red-600",
              "border-red-300",
              "hover:bg-red-600"
            );
            btn.classList.remove("btn-list");
            btn.classList.add("btn-unlist");
          }

          const badge = document.querySelector(
            `[data-brand-status][data-brand-id="${brandId}"]`
          );

          if (badge) {
            badge.textContent = isListed ? "Unlisted" : "Listed";

            if (isListed) {
              badge.classList.remove("bg-green-100", "text-green-700");
              badge.classList.add("bg-red-100", "text-red-700");
              badge.classList.remove("status-listed");
              badge.classList.add("status-unlisted");
            } else {
              badge.classList.remove("bg-red-100", "text-red-700");
              badge.classList.add("bg-green-100", "text-green-700");
              badge.classList.remove("status-unlisted");
              badge.classList.add("status-listed");
            }
          }

          Toastify({
            text: isListed ? "Brand Unlisted" : "Brand Listed",
            duration: 1000,
            gravity: "bottom",
            position: "right",
            style: {
              background: isListed
                ? "#e74c3c"
                : "linear-gradient(to right, #00b09b, #96c93d)",
            },
          }).showToast();
        }
      } catch (error) {
        console.error(error);
        Toastify({
          text: "Something went wrong",
          duration: 2000,
          gravity: "bottom",
          position: "right",
          style: { background: "#e74c3c" },
        }).showToast();
      }
    };

    // ✅ GLOBAL CONFIRM MODAL (both actions)
    openConfirmModal({
      title: isListed ? "Unlist Brand" : "List Brand",
      message: isListed
        ? "Are you sure you want to unlist this brand?"
        : "Do you want to list this brand?",
      onConfirm: proceed,
    });
  });
});


// --------------------------------------
//  Search(Debouncing)+pagination+filter
// --------------------------------------

function changePage(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.location.href = url.href;
}

let searchTimeout;
function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(handleSearch, 1000);
}

function handleSearch() {
  const searchValue = document.getElementById("brand-search-input").value;
  const url = new URL(window.location);
  if (searchValue) {
    url.searchParams.set("search", searchValue);
  } else {
    url.searchParams.delete("search");
  }
  url.searchParams.set("page", 1);
  window.location.href = url.href;
}

function clearSearch() {
  const url = new URL(window.location);
  url.searchParams.delete("search");
  window.location.href = url.href;
}

function applyFilter() {
  const filter = document.getElementById("brand-filter-select").value;

  const url = new URL(window.location);
  if (filter) {
    url.searchParams.set("filter", filter);
  } else {
    url.searchParams.delete("filter");
  }
  url.searchParams.set("page", 1);
  window.location.href = url.href;
}
