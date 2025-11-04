document.addEventListener("DOMContentLoaded", () => {
  const modalOverlay = document.getElementById("modal-overlay");

  // --- General Modal Open/Close Logic ---
  function openModal(modal) {
    if (modal == null) return;
    modal.classList.add("active");
    modalOverlay.classList.add("active");
  }

  function closeModal(modal) {
    if (modal == null) return;
    modal.classList.remove("active");
    modalOverlay.classList.remove("active");
  }

  // Close buttons (X and Cancel)
  document.querySelectorAll("[data-close-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = document.querySelector(button.dataset.closeTarget);
      closeModal(modal);
    });
  });

  // Close by clicking overlay
  modalOverlay.addEventListener("click", () => {
    document.querySelectorAll(".modal-admin.active").forEach((modal) => {
      closeModal(modal);
    });
  });

  // --- 1. "Add Brand" Modal ---
  const addModal = document.getElementById("add-brand-modal");
  const openAddModalBtn = document.getElementById("open-add-modal-btn");

  openAddModalBtn.addEventListener("click", () => {
    openModal(addModal);
  });

  // --- 2. "Edit Brand" Modal ---
  const editModal = document.getElementById("edit-brand-modal");
  const editForm = document.getElementById("edit-brand-form");
  const editBrandId = document.getElementById("editBrandId");
  const editBrandName = document.getElementById("editBrandName");
  const editImagePreview = document.getElementById("edit-image-preview");

  document.querySelectorAll(".open-edit-modal-btn").forEach((button) => {
    button.addEventListener("click", () => {
      // Get data from the button's data attributes
      const id = button.dataset.brandId;
      const name = button.dataset.brandName;
      const imageUrl = button.dataset.brandImage;

      // Populate the form
      editBrandId.value = id;
      editBrandName.value = name;


      // Populate the image preview
      editImagePreview.innerHTML = `<img src="${imageUrl}" alt="${name}">`;

      // Open the modal
      openModal(editModal);
    });
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
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
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (error) {
      console.error(error);
      Toastify({
        text: error.response?.data?.message || "Failed to add brand",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: {
          background: "#e74c3c",
        },
      }).showToast();
    }
  });

  // --- Optional: File Drop Zone Script (for "Add Brand" modal) ---
  const dropZoneAdd = document.getElementById("file-drop-zone-add");
  const fileInputAdd = document.getElementById("brandLogoAdd");
  const previewAdd = document.querySelector(".file-preview-add");
  const dropContentAdd = dropZoneAdd.querySelector(".file-drop-content");

  // Trigger file input click
  dropZoneAdd.addEventListener("click", () => fileInputAdd.click());

  // Handle file selection
  fileInputAdd.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        previewAdd.innerHTML = `<img src="${e.target.result}" alt="Logo Preview">`;
        previewAdd.style.display = "block";
        dropContentAdd.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
  });

  // --- File Drop Zone Script (for "Edit Brand" modal) ---
const dropZoneEditContainer = document.querySelector(".file-drop-zone-edit");
const fileInputEdit = document.getElementById("brandLogoEdit");
const previewEdit = document.getElementById("edit-image-preview");
const dropContentEdit = document.getElementById("file-drop-zone-edit");

// Trigger file input click when the drop zone area is clicked
// Note: We're listening on the container to allow clicks on the existing image or the "upload" text
dropZoneEditContainer.addEventListener("click", () => fileInputEdit.click());

// Handle file selection
fileInputEdit.addEventListener("change", (e) => {
  if (e.target.files && e.target.files[0]) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      // Set the new image preview
      previewEdit.innerHTML = `<img src="${e.target.result}" alt="New Logo Preview">`;
      // Ensure the preview <div> is visible
      previewEdit.style.display = "block";
      // Hide the "Drag & drop" text content
      dropContentEdit.style.display = "none";
    };
    
    reader.readAsDataURL(file);
  }
});

  

  // --- NEW: Filter Dropdown Script ---
  const filterBtn = document.getElementById("filter-btn");
  const filterMenu = document.getElementById("filter-menu");
  const filterContainer = filterBtn
    ? filterBtn.closest(".filter-dropdown-container")
    : null;

  if (filterBtn && filterMenu && filterContainer) {
    // Toggle menu on button click
    filterBtn.addEventListener("click", () => {
      filterContainer.classList.toggle("active");
    });

    // Close menu if clicking outside
    document.addEventListener("click", (e) => {
      if (!filterContainer.contains(e.target)) {
        filterContainer.classList.remove("active");
      }
    });
  }

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
            style: {
              background: "linear-gradient(to right, #00b09b, #96c93d)",
            },
          }).showToast();
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        }
      } catch (error) {
        console.error(error);
        Toastify({
          text: error.response?.data?.message || "Failed to add brand",
          duration: 2000,
          gravity: "top",
          position: "right",
          style: {
            background: "#e74c3c",
          },
        }).showToast();
      }
    });
  document.querySelectorAll(".btn-unlist").forEach((button) => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();

      const brandId = button.dataset.brandId;
      const isListed = button.dataset.brandIslisted === "true";

      try {
        const response = await axios.patch(`/admin/brands/list/${brandId}`);
        if (response.data.success) {
          Toastify({
            text: isListed ? "Brand is now unlisted" : "Brand is now listed",
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
          text: error.response?.data?.message || "Something went wrong",
          duration: 2000,
          gravity: "top",
          position: "right",
          style: { background: "#e74c3c" },
        }).showToast();
      }
    });
  });
});
