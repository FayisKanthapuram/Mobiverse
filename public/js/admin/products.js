document.addEventListener("DOMContentLoaded", () => {
  //================================================
  // 1. Modal Handling
  //================================================
  const addModal = document.getElementById("add-product-modal");
  const editModal = document.getElementById("edit-product-modal");
  const openAddModalBtn = document.getElementById("open-add-modal-btn");
  const closeModalBtns = document.querySelectorAll(".close-modal-btn");

  const openModal = (modal) => modal && (modal.style.display = "flex");
  const closeModal = (modal) => modal && (modal.style.display = "none");

  if (openAddModalBtn) {
    openAddModalBtn.addEventListener("click", () => {
      openModal(addModal);
      if (document.getElementById("add-variant-list").childElementCount === 0) {
        addVariantForm("add");
      }
    });
  }

  closeModalBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeModal(addModal);
      closeModal(editModal);
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target === addModal) closeModal(addModal);
    if (e.target === editModal) closeModal(editModal);
  });

  //================================================
  // 2. Accordion (Step) Handling
  //================================================
  document.querySelectorAll(".step-header").forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      header.classList.toggle("active");
      content.style.display =
        content.style.display === "block" ? "none" : "block";
    });
  });

  //================================================
  // 3. Dynamic Variant Handling
  //================================================
  const variantTemplate = document.getElementById("variant-template");

  const addVariantForm = (modalTypePrefix) => {
    if (!variantTemplate) return;
    const variantList = document.getElementById(
      `${modalTypePrefix}-variant-list`
    );
    if (!variantList) return;

    const newVariant = variantTemplate.content.cloneNode(true);
    const variantCount = variantList.children.length + 1;
    newVariant.querySelector(".variant-number").textContent = variantCount;

    newVariant.querySelector(".variant-stock").addEventListener("input", () => {
      updateTotalStock(modalTypePrefix);
    });

    newVariant
      .querySelector(".btn-remove-variant")
      .addEventListener("click", (e) => {
        e.currentTarget.closest(".variant-form-section").remove();
        updateVariantNumbers(modalTypePrefix);
        updateTotalStock(modalTypePrefix);
      });

    variantList.appendChild(newVariant);
  };

  const updateVariantNumbers = (modalTypePrefix) => {
    const variantList = document.getElementById(
      `${modalTypePrefix}-variant-list`
    );
    if (!variantList) return;
    variantList.querySelectorAll(".variant-form-section").forEach((v, i) => {
      v.querySelector(".variant-number").textContent = i + 1;
    });
  };

  const updateTotalStock = (modalTypePrefix) => {
    const variantList = document.getElementById(
      `${modalTypePrefix}-variant-list`
    );
    const totalStockEl = document.getElementById(
      `${modalTypePrefix}-total-stock`
    );
    if (!variantList || !totalStockEl) return;

    let total = 0;
    variantList.querySelectorAll(".variant-stock").forEach((input) => {
      total += parseInt(input.value) || 0;
    });
    totalStockEl.textContent = `${total} units`;
  };

  document
    .getElementById("add-variant-btn")
    ?.addEventListener("click", () => addVariantForm("add"));
  document
    .getElementById("edit-add-variant-btn")
    ?.addEventListener("click", () => addVariantForm("edit"));

  //================================================
  // 4. Edit Product Modal populate
  //================================================
  document.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const productId = e.currentTarget.dataset.productId;

      try {
        const response = await axios.get(`/admin/api/product/${productId}`);
        console.log(response.data.products);
        populateEditModal(response.data.products);
        openModal(editModal);
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        Toastify({
          text: "Could not load product data. Please try again.",
          duration: 2000,
          gravity: "top",
          position: "right",
          style: { background: "#e74c3c" },
        }).showToast();
      }
    });
  });

  const populateEditModal = (product) => {
    const form = document.getElementById("edit-product-form");
    form.querySelector("#edit-product-id").value = product._id;
    form.querySelector("#edit-product-name").value = product.name;
    form.querySelector("#edit-brand").value = product.brandID;
    form.querySelector("#edit-description").value = product.description;
    form.querySelector("#edit-featured").checked = product.isFeatured;
    form.querySelector("#edit-status").checked = product.isListed;

    const variantList = form.querySelector("#edit-variant-list");
    variantList.innerHTML = "";
    product.variants.forEach((variant) => addEditVariantForm(variant));

    updateTotalStock("edit");
  };

  const addEditVariantForm = (variant) => {
    if (!variantTemplate) return;
    const variantList = document.getElementById("edit-variant-list");
    const newVariant = variantTemplate.content.cloneNode(true);
    const variantCount = variantList.children.length + 1;
    newVariant.querySelector(".variant-number").textContent = variantCount;

    const variantSection = newVariant.querySelector(".variant-form-section");
    variantSection.dataset.variantId = variant._id || "";

    newVariant.querySelector('input[name="regularPrice"]').value =
      variant.regularPrice || "";
    newVariant.querySelector('input[name="salePrice"]').value =
      variant.salePrice || "";
    newVariant.querySelector('select[name="ram"]').value = variant.ram || "4GB";
    newVariant.querySelector('select[name="storage"]').value =
      variant.storage || "64GB";
    newVariant.querySelector('input[name="colour"]').value =
      variant.colour || "";
    newVariant.querySelector('input[name="stockQuantity"]').value =
      variant.stock || 0;
    newVariant.querySelector('#varient-status').checked=variant.isListed;

    // 🖼️ Populate existing images
    const fileInput = newVariant.querySelector(".variant-image-upload-input");
    const previewContainer = newVariant.querySelector(".variant-image-preview");

    if (variant.images && variant.images.length > 0) {
      populateVariantImagesForEdit(fileInput, previewContainer, variant.images);
    } else {
      variantImagesMap.set(fileInput, []);
    }

    // Stock / remove handlers
    newVariant
      .querySelector(".variant-stock")
      .addEventListener("input", () => updateTotalStock("edit"));
    newVariant
      .querySelector(".btn-remove-variant")
      .addEventListener("click", (e) => {
        e.currentTarget.closest(".variant-form-section").remove();
        updateVariantNumbers("edit");
        updateTotalStock("edit");
      });

    variantList.appendChild(newVariant);
  };

  //================================================
  // 5. VARIANT IMAGE UPLOAD + MULTI CROPPER (UPDATED)
  //================================================
  const cropperModal = document.getElementById("cropperModal");
  const cropperImage = document.getElementById("cropperImage");
  const cancelCropBtn = document.getElementById("cancelCropBtn");
  const applyCropBtn = document.getElementById("applyCropBtn");
  const nextCropBtn = document.createElement("button");
  nextCropBtn.textContent = "Next";
  nextCropBtn.className = "btn btn-primary";
  nextCropBtn.style.display = "none";
  cropperModal.querySelector(".cropper-actions").appendChild(nextCropBtn);

  let cropper;
  let activeInput = null;
  let imageFiles = [];
  let currentIndex = 0;

  const variantImagesMap = new Map();

  document.addEventListener("change", (e) => {
    if (!e.target.classList.contains("variant-image-upload-input")) return;

    const input = e.target;
    const files = Array.from(input.files);
    if (files.length === 0) return;

    activeInput = input;
    imageFiles = files;
    currentIndex = 0;

    openCropperForCurrent();
  });

  function openCropperForCurrent() {
    const file = imageFiles[currentIndex];
    const reader = new FileReader();
    reader.onload = (evt) => {
      cropperImage.src = evt.target.result;
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

      applyCropBtn.style.display =
        currentIndex === imageFiles.length - 1 ? "inline-block" : "none";
      nextCropBtn.style.display =
        currentIndex < imageFiles.length - 1 ? "inline-block" : "none";
    };
    reader.readAsDataURL(file);
  }

  cancelCropBtn.addEventListener("click", () => {
    cropperModal.classList.remove("active");
    cropper?.destroy();
    cropper = null;
    activeInput = null;
  });

  nextCropBtn.addEventListener("click", () => handleCrop(true));
  applyCropBtn.addEventListener("click", () => handleCrop(false));

  async function handleCrop(hasNext) {
    const canvas = cropper.getCroppedCanvas({ imageSmoothingQuality: "high" });
    const croppedUrl = canvas.toDataURL("image/png");

    const blob = await (await fetch(croppedUrl)).blob();
    const originalName = imageFiles[currentIndex].name.split(".")[0];
    const croppedFile = new File([blob], `${originalName}_cropped.png`, {
      type: "image/png",
    });

    if (!variantImagesMap.has(activeInput))
      variantImagesMap.set(activeInput, []);
    variantImagesMap
      .get(activeInput)
      .push({ file: croppedFile, url: croppedUrl });

    if (cropper) cropper.destroy();
    currentIndex++;

    if (hasNext && currentIndex < imageFiles.length) {
      openCropperForCurrent();
    } else if (!hasNext) {
      finalizeVariantImages(activeInput);
    }
  }

  function finalizeVariantImages(inputElement) {
    cropperModal.classList.remove("active");

    const entries = variantImagesMap.get(inputElement) || [];
    const dt = new DataTransfer();
    entries.forEach((entry) => {
      if (entry.file instanceof File) dt.items.add(entry.file);
    });
    inputElement.files = dt.files;

    const previewContainer = inputElement
      .closest(".form-group")
      .querySelector(".variant-image-preview");
    renderVariantPreview(inputElement, previewContainer);

    cropper = null;
    activeInput = null;
  }

  function populateVariantImagesForEdit(fileInput, previewContainer, images) {
    const formatted = images.map((img) =>
      typeof img === "string"
        ? { url: img, isExisting: true }
        : { ...img, isExisting: true }
    );
    variantImagesMap.set(fileInput, formatted);
    renderVariantPreview(fileInput, previewContainer);
  }

  function renderVariantPreview(inputElement, previewContainer) {
    previewContainer.innerHTML = "";
    const list = variantImagesMap.get(inputElement) || [];

    list.forEach((entry, idx) => {
      const url = entry.url || (entry.file && URL.createObjectURL(entry.file));
      const wrapper = document.createElement("div");
      wrapper.className = "img-preview-wrapper";
      wrapper.innerHTML = `
        <img src="${url}" class="img-preview" />
        <button type="button" class="remove-img-btn" data-index="${idx}">&times;</button>
      `;
      previewContainer.appendChild(wrapper);
    });

    previewContainer.querySelectorAll(".remove-img-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = Number(e.currentTarget.dataset.index);
        const arr = variantImagesMap.get(inputElement) || [];
        arr.splice(index, 1);
        variantImagesMap.set(inputElement, arr);
        renderVariantPreview(inputElement, previewContainer);

        const dt2 = new DataTransfer();
        arr.forEach((entry) => {
          if (entry.file instanceof File) dt2.items.add(entry.file);
        });
        inputElement.files = dt2.files;
      });
    });
  }

  //================================================
  // 6. ADD PRODUCT (AXIOS)
  //================================================
  const form = document.getElementById("add-product-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append(
      "productName",
      document.getElementById("add-product-name").value.trim()
    );
    formData.append("brand", document.getElementById("add-brand").value);
    formData.append(
      "description",
      document.getElementById("add-description").value.trim()
    );
    formData.append(
      "isFeatured",
      document.getElementById("add-featured").checked
    );
    formData.append("isListed", document.getElementById("add-status").checked);

    const variantSections = form.querySelectorAll(".variant-form-section");
    const variants = [];

    variantSections.forEach((section, index) => {
      const variantData = {
        regularPrice: section.querySelector('input[name="regularPrice"]').value,
        salePrice: section.querySelector('input[name="salePrice"]').value,
        ram: section.querySelector('select[name="ram"]').value,
        storage: section.querySelector('select[name="storage"]').value,
        colour: section.querySelector('input[name="colour"]').value.trim(),
        stockQuantity: section.querySelector('input[name="stockQuantity"]')
          .value,
        isListed: section.querySelector('input[name="isListed"]').checked,
      };

      const input = section.querySelector(".variant-image-upload-input");
      const images = variantImagesMap.get(input) || [];
      images.forEach((entry, idx) => {
        if (entry.file)
          formData.append(`variantImages_${index}_${idx}`, entry.file);
      });

      variants.push(variantData);
    });

    formData.append("variants", JSON.stringify(variants));

    try {
      const response = await axios.post("/admin/products/add", formData, {
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
    } catch (err) {
      console.error(err);
      Toastify({
        text: err.response?.data?.message || "Failed to add product",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: { background: "#e74c3c" },
      }).showToast();
    }
  });

  //================================================
  // 7. List / Unlist (AXIOS)
  //================================================

  document.querySelectorAll(".btn-unlist, .btn-list").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const target = e.currentTarget;
      const productId = target.dataset.productId;
      const isListed = target.dataset.productIslisted === "true";

      if (isListed && !confirm("Are you sure you want to unlist this product?"))
        return;

      target.disabled = true;

      try {
        const response = await axios.patch(`/admin/products/list/${productId}`);
        if (response.data.success) {
          target.dataset.productIslisted = (!isListed).toString();

          if (isListed) {
            target.textContent = "List";
            target.classList.replace("btn-unlist", "btn-list");
          } else {
            target.textContent = "Unlist";
            target.classList.replace("btn-list", "btn-unlist");
          }

          const badge = document.querySelector(
            `[data-product-status][data-product-id="${productId}"]`
          );
          if (badge) {
            badge.textContent = isListed ? "Unlisted" : "Listed";
            badge.classList.toggle("status-listed", !isListed);
            badge.classList.toggle("status-unlisted", isListed);
          }

          Toastify({
            text: isListed ? "Product Unlisted" : "Product Listed",
            duration: 1500,
            gravity: "top",
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
          text: error.response?.data?.message || "Something went wrong",
          duration: 2000,
          gravity: "top",
          position: "right",
          style: { background: "#e74c3c" },
        }).showToast();
      } finally {
        target.disabled = false;
      }
    });
  });

  //================================================
  // 8. EDIT PRODUCT (AXIOS)
  //================================================
  const editForm = document.getElementById("edit-product-form");

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();

    // 🆔 Get product ID
    const productId = document.getElementById("edit-product-id").value;

    // 🧾 Collect product details
    const productName = document
      .getElementById("edit-product-name")
      .value.trim();
    const brand = document.getElementById("edit-brand").value;
    const description = document
      .getElementById("edit-description")
      .value.trim();

    formData.append("productName", productName);
    formData.append("brand", brand);
    formData.append("description", description);
    formData.append(
      "isFeatured",
      document.getElementById("edit-featured").checked
    );
    formData.append("isListed", document.getElementById("edit-status").checked);

    // 🧩 Collect variant data
    const variantSections = editForm.querySelectorAll(".variant-form-section");
    const variants = [];

    variantSections.forEach((section, index) => {
      const variantData = {
        _id: section.dataset.variantId || null, // Include variantId if editing existing one
        regularPrice: section.querySelector('input[name="regularPrice"]').value,
        salePrice: section.querySelector('input[name="salePrice"]').value,
        ram: section.querySelector('select[name="ram"]').value,
        storage: section.querySelector('select[name="storage"]').value,
        colour: section.querySelector('input[name="colour"]').value.trim(),
        stockQuantity: section.querySelector('input[name="stockQuantity"]')
          .value,
        isListed: section.querySelector('input[name="isListed"]').checked,
      };

      // 📸 Handle variant images
      const input = section.querySelector(".variant-image-upload-input");
      const images = variantImagesMap.get(input) || [];

      const existingImageUrls = [];

      // Separate existing & new images
      images.forEach((entry, idx) => {
        if (entry.file instanceof File) {
          formData.append(`variantImages_${index}_${idx}`, entry.file);
        } else if (entry.isExisting && entry.url) {
          existingImageUrls.push(entry.url);
        }
      });

      // Add existing image URLs to variantData
      variantData.existingImages = existingImageUrls;

      variants.push(variantData);
    });

    formData.append("variants", JSON.stringify(variants));

    // 🧠 Send request
    try {
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      const response = await axios.patch(
        `/admin/products/edit/${productId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        Toastify({
          text: response.data.message || "Product updated successfully!",
          duration: 1000,
          gravity: "top",
          position: "right",
          style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
        }).showToast();

        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (err) {
      console.error(err);
      Toastify({
        text: err.response?.data?.message || "Failed to update product",
        duration: 2000,
        gravity: "top",
        position: "right",
        style: { background: "#e74c3c" },
      }).showToast();
    }
  });
});

// --------------------------------------
//  9.Search(Debouncing)+pagination+filter
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
  const searchValue = document.getElementById("product-search-input").value;
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
  const brandSelect = document.querySelector('select[name="brand"]');
  const brand = brandSelect ? brandSelect.value : "";
  const status = document.querySelector('select[name="status"]').value;

  const url = new URL(window.location);

  if (brand) {
    url.searchParams.set("brand", brand);
  } else {
    url.searchParams.delete("brand");
  }

  if (status) {
    url.searchParams.set("status", status);
  } else {
    url.searchParams.delete("status");
  }

  url.searchParams.set("page", 1);
  window.location.href = url.href;
}
