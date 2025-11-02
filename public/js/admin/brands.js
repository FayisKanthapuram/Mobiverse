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
  const editForm = editModal.querySelector("form");
  const editBrandId = document.getElementById("editBrandId");
  const editBrandName = document.getElementById("editBrandName");
  const editImagePreview = document.getElementById("edit-image-preview");
  const editIsListed = document.getElementById("editIsListed");

  document.querySelectorAll(".open-edit-modal-btn").forEach((button) => {
    button.addEventListener("click", () => {
      // Get data from the button's data attributes
      const id = button.dataset.brandId;
      const name = button.dataset.brandName;
      const imageUrl = button.dataset.brandImage;
      const isListed = button.dataset.brandListed === "true";

      // Populate the form
      editBrandId.value = id;
      editBrandName.value = name;
      editIsListed.checked = isListed;

      // Set the form's 'action' attribute dynamically
      editForm.action = `/admin/brands/edit/${id}`;

      // Populate the image preview
      editImagePreview.innerHTML = `<img src="${imageUrl}" alt="${name}">`;

      // Open the modal
      openModal(editModal);
    });
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

  // --- This part is for your backend form ---
  // It updates the hidden input and button text when an option is clicked.
  // This is optional but good for user experience.
  const filterOptions = document.querySelectorAll(".filter-option");
  const filterBtnText = document.getElementById("filter-btn-text");
  const hiddenInput = document.getElementById("filter-hidden-input");

  if (filterOptions && filterBtnText && hiddenInput) {
    filterOptions.forEach((option_) => {
      option.addEventListener("click", function (e) {
        // Prevent default link behavior if you want to submit via form
        // e.preventDefault();

        const value = this.dataset.value;
        filterBtnText.textContent = value;
        hiddenInput.value = value;

        // You could auto-submit the form here if you want:
        // this.closest('form').submit();
      });
    });
  }
});

