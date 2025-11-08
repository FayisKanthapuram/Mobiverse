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
  // 4. Edit Product Modal Population
  //================================================
  document.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const productId = e.currentTarget.dataset.productId;

      const dummyProduct = {
        _id: "67890fgh",
        name: "Galaxy S24",
        brand: "Samsung",
        description: "Flagship Samsung phone with AI features",
        images: ["/images/logo.png", "/images/logo.png", "/images/logo.png"],
        isFeatured: false,
        status: "Unlisted",
        variants: [
          {
            regularPrice: 69999,
            salePrice: 69999,
            ram: "8GB",
            storage: "128GB",
            colour: "Black",
            stockQuantity: 20,
          },
          {
            regularPrice: 109999,
            salePrice: 109999,
            ram: "12GB",
            storage: "512GB",
            colour: "Cream",
            stockQuantity: 32,
          },
        ],
      };
      populateEditModal(dummyProduct);
      openModal(editModal);
    });
  });

  const populateEditModal = (product) => {
    const form = document.getElementById("edit-product-form");
    form.querySelector("#edit-product-id").value = product._id;
    form.querySelector("#edit-product-name").value = product.name;
    form.querySelector("#edit-brand").value = product.brand;
    form.querySelector("#edit-description").value = product.description;
    form.querySelector("#edit-featured").checked = product.isFeatured;
    form.querySelector("#edit-status").checked = product.status === "Listed";

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

    newVariant.querySelector('input[name="regularPrice"]').value =
      variant.regularPrice;
    newVariant.querySelector('input[name="salePrice"]').value =
      variant.salePrice;
    newVariant.querySelector('select[name="ram"]').value = variant.ram;
    newVariant.querySelector('select[name="storage"]').value = variant.storage;
    newVariant.querySelector('input[name="colour"]').value = variant.colour;
    newVariant.querySelector('input[name="stockQuantity"]').value =
      variant.stockQuantity;

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

  // 🧩 Each variant’s images stored here
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
          aspectRatio: 1,
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

    // Save in map
    if (!variantImagesMap.has(activeInput))
      variantImagesMap.set(activeInput, []);
    variantImagesMap.get(activeInput).push(croppedFile);

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

    const files = variantImagesMap.get(inputElement) || [];
    const dt = new DataTransfer();
    files.forEach((file) => dt.items.add(file));
    inputElement.files = dt.files;

    const previewContainer = inputElement
      .closest(".form-group")
      .querySelector(".variant-image-preview");
    previewContainer.innerHTML = "";
    files.forEach((file, idx) => {
      const url = URL.createObjectURL(file);
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
        const index = e.currentTarget.dataset.index;
        const list = variantImagesMap.get(inputElement);
        list.splice(index, 1);
        finalizeVariantImages(inputElement);
      });
    });

    cropper = null;
    activeInput = null;
  }

  //================================================
  // 6. ADD PRODUCT (AXIOS)
  //================================================
  const form = document.getElementById("add-product-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ✅ Step 1: Validate minimum 3 images per variant
    const variantInputs = document.querySelectorAll(
      ".variant-image-upload-input"
    );

    // ✅ Step 2: Continue normal product data collection
    const formData = new FormData();

    const productName = document
      .getElementById("add-product-name")
      .value.trim();
    const brand = document.getElementById("add-brand").value;
    const description = document.getElementById("add-description").value.trim();

    formData.append("productName", productName);
    formData.append("brand", brand);
    formData.append("description", description);
    formData.append(
      "isFeatured",
      document.getElementById("add-featured").checked
    );
    formData.append("status", document.getElementById("add-status").checked);

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
      };

      const input = section.querySelector(".variant-image-upload-input");
      const images = variantImagesMap.get(input) || [];
      images.forEach((file, idx) => {
        formData.append(`variantImages_${index}_${idx}`, file);
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

        form.reset();
        document.getElementById("add-product-modal").style.display = "none";
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
});
