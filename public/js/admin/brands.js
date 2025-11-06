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
      preview.style.display = "flex";
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
        aspectRatio: 1,
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
    preview.style.display = "flex";
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
  preview.style.display = "none";
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
    const formData = new FormData(e.target);

    try {
      const response = await axios.post("/admin/brands/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        Toastify({
          text: response.data.message,
          duration: 1000,
          gravity: "top",
          position: "right",
          style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
        }).showToast();
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (error) {
      Toastify({
        text: error.response?.data?.message || "Failed to add brand",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: { background: "#e74c3c" },
      }).showToast();
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
      const response = await axios.get(`/admin/api/brands/${brandId}`);
      const brand = response.data.data;
      populateEditModal(brand);
      openModal(editModal);
    } catch (error) {
      console.error("Failed to fetch product data:", error);
      Toastify({
        text: "Could not load brand data. Please try again.",
        duration: 2000,
        gravity: "top",
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
  uploadPreviewEdit.style.display = "flex";
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

uploadContainerEdit.addEventListener("click", () => fileInputEditCrop.click()); //It makes the entire upload box area clickable

fileInputEditCrop.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const ext = file.name.split(".").pop().toLowerCase(); //extract file extension in lower case
  if (ext === "svg") {
    //f the file is an SVG, we don’t want to crop it.SVGs are vector images — cropping them doesn’t make sense.
    const reader = new FileReader();
    reader.onload = (event) => {
      croppedImagePreviewEdit.src = event.target.result;
      previewEditCrop.style.display = "flex";
      placeholderEdit.style.display = "none"; //remove the text in there
    };
    reader.readAsDataURL(file);
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    //.onload is working after image is loaded
    cropperImageEdit.src = event.target.result;
    cropperModalEdit.classList.add("active");
    cropperImageEdit.onload = () => {
      if (cropperEdit) cropperEdit.destroy();
      cropperEdit = new Cropper(cropperImageEdit, {
        aspectRatio: 1,
        viewMode: 1, // Restrict cropping inside the image bounds
        autoCropArea: 1, //Automatically fill the whole image initially
        background: true,
        responsive: true, //responsive copper
      });
    };
  };
  reader.readAsDataURL(file); //after this reader.onload works(it read the image file from disk)
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
    //.toBlob converts whatever is drawn inside that canvas (your cropped image) into a binary file object called a Blob.
    const croppedUrl = canvas.toDataURL("image/png"); //Creates a preview URL that the browser can show
    croppedImagePreviewEdit.src = croppedUrl;
    previewEditCrop.style.display = "flex";
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
  previewEditCrop.style.display = "none";
  placeholderEdit.style.display = "block";
  fileInputEditCrop.value = "";
});

// --------------------------------------
// 🧾 Edit Brand Submit (Axios)
// --------------------------------------
editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  console.log(e.target);

  try {
    const response = await axios.patch(`/admin/brands/edit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.success) {
      Toastify({
        text: response.data.message,
        duration: 1000,
        gravity: "top",
        position: "right",
        style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
      }).showToast();
      setTimeout(() => window.location.reload(), 1200);
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Failed to update brand",
      duration: 2000,
      gravity: "top",
      position: "right",
      style: { background: "#e74c3c" },
    }).showToast();
  }
});

// --------------------------------------
// 🔁 List / Unlist Brand
// --------------------------------------
document.querySelectorAll(".btn-unlist").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const brandId = btn.dataset.brandId;
    const isListed = btn.dataset.brandIslisted === "true";

    try {
      const response = await axios.patch(`/admin/brands/list/${brandId}`);
      if (response.data.success) {
        Toastify({
          text: isListed ? "Brand Unlisted" : "Brand Listed",
          duration: 1000,
          gravity: "top",
          position: "right",
          style: {
            background: isListed
              ? "#e74c3c"
              : "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (error) {
      Toastify({
        text: "Something went wrong",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: { background: "#e74c3c" },
      }).showToast();
    }
  });
});

// --------------------------------------
// 🔽 Filter Dropdown
// --------------------------------------
const filterBtn = document.getElementById("filter-btn");
const filterMenu = document.getElementById("filter-menu");
const filterContainer = filterBtn?.closest(".filter-dropdown-container");

if (filterBtn && filterMenu && filterContainer) {
  filterBtn.addEventListener("click", () =>
    filterContainer.classList.toggle("active")
  );
  document.addEventListener("click", (e) => {
    if (!filterContainer.contains(e.target))
      filterContainer.classList.remove("active");
  });
}

// --------------------------------------
// 🔍 Search (Debounce Auto Submit)
// --------------------------------------
const searchInput = document.getElementById("brand-search-input");
const searchForm = document.getElementById("brand-search-form");
let typingTimer;
const typingDelay = 500;

searchInput.addEventListener("input", () => {
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => searchForm.submit(), typingDelay);
});
