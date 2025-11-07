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

    for (let i = 0; i < 3; i++) {
      const previewContainer = form.querySelector(
        `#edit-preview-image${i + 1}`
      );
      previewContainer.innerHTML = `<img src="${
        product.images[i] || "/images/default-product.png"
      }" class="img-preview" />`;
    }

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
  // 5. PRODUCT IMAGE UPLOAD + CROPPER
  //================================================
  const cropperModal = document.getElementById("cropperModal");
  const cropperImage = document.getElementById("cropperImage");
  const cancelCropBtn = document.getElementById("cancelCropBtn");
  const applyCropBtn = document.getElementById("applyCropBtn");

  let cropper;
  let activeInput = null;

  document.querySelectorAll(".image-upload-input").forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      activeInput = e.target;
      const ext = file.name.split(".").pop().toLowerCase();

      if (ext === "svg") {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const previewContainer =
            input.closest(".image-upload-box").nextElementSibling;
          previewContainer.innerHTML = `<img src="${evt.target.result}" class="img-preview" />`;
        };
        reader.readAsDataURL(file);
        return;
      }

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
            movable: true,
            zoomable: true,
          });
        };
      };
      reader.readAsDataURL(file);
    });
  });

  cancelCropBtn.addEventListener("click", () => {
    cropperModal.classList.remove("active");
    if (cropper) cropper.destroy();
    cropper = null;
    if (activeInput) activeInput.value = "";
    activeInput = null;
  });

  applyCropBtn.addEventListener("click", () => {
    if (!cropper || !activeInput) return;

    try {
      const canvas = cropper.getCroppedCanvas({
        imageSmoothingQuality: "high",
      });

      // Convert to base64 image immediately (synchronous)
      const croppedUrl = canvas.toDataURL("image/png");

      // Show preview
      const previewContainer =
        activeInput.closest(".image-upload-box").nextElementSibling;
      previewContainer.innerHTML = `<img src="${croppedUrl}" class="img-preview" />`;

      // Convert base64 to Blob for file upload
      fetch(croppedUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const originalName = activeInput.files[0].name;
          const baseName =
            originalName.substring(0, originalName.lastIndexOf(".")) ||
            originalName;
          const croppedFile = new File([blob], baseName + ".png", {
            type: "image/png",
            lastModified: Date.now(),
          });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(croppedFile);
          activeInput.files = dataTransfer.files;

          // Hide crop modal
          cropperModal.classList.remove("active");
          cropper.destroy();
          cropper = null;
          activeInput = null;
        });
    } catch (err) {
      console.error("Crop apply failed:", err);
      alert("Something went wrong while applying crop. Try again.");
    }
  });
});
