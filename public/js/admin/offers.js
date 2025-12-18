// Offers Management JavaScript

let searchTimeout;
let currentOfferType = "product";
let selectedProducts = []; // Array to store selected products

// Modal Management
function openAddOfferModal() {
  const modal = document.getElementById("offerModal");
  const form = document.getElementById("offerForm");
  const modalTitle = document.getElementById("modalTitle");
  const submitBtnText = document.getElementById("submitBtnText");

  // Reset form
  form.reset();
  document.getElementById("offerId").value = "";

  // Clear selections
  clearAllProducts();

  // Hide both selection sections initially
  document.getElementById("productSelectionSection").classList.add("hidden");
  document.getElementById("brandSelectionSection").classList.add("hidden");

  // Set modal title
  modalTitle.textContent = "Add New Offer";
  submitBtnText.textContent = "Create Offer";

  // Show modal
  modal.classList.add("show");

  // Set today as minimum date
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("startDate").min = today;
  document.getElementById("endDate").min = today;
}

function closeOfferModal() {
  const modal = document.getElementById("offerModal");
  modal.classList.remove("show");

  // Clear search results
  document.getElementById("productSearchResults").innerHTML = "";
  document.getElementById("productSearchResults").classList.remove("show");
}

// Close modal on outside click
window.onclick = function (event) {
  const modal = document.getElementById("offerModal");
  if (event.target === modal) {
    closeOfferModal();
  }
};

// Close search results when clicking outside
document.addEventListener("click", function (event) {
  const searchWrapper = document.querySelector(".search-select-wrapper");
  const resultsDiv = document.getElementById("productSearchResults");

  if (searchWrapper && resultsDiv && !searchWrapper.contains(event.target)) {
    resultsDiv.classList.remove("show");
  }
});

// Handle Discount Type Change
function handleDiscountTypeChange() {
  const discountType = document.getElementById("discountType").value;
  const discountValue = document.getElementById("discountValue");
  const discountIcon = document.getElementById("discountIcon");
  const discountHelp = document.getElementById("discountHelp");

  if (discountType === "percentage") {
    discountIcon.textContent = "%";
    discountHelp.textContent = "Enter discount percentage (1-90%)";
    discountValue.placeholder = "e.g., 20";
    discountValue.max = "90";
    discountValue.min = "1";
  } else if (discountType === "fixed") {
    discountIcon.textContent = "₹";
    discountHelp.textContent = "Enter fixed discount amount";
    discountValue.placeholder = "e.g., 500";
    discountValue.removeAttribute("max");
    discountValue.min = "1";
  }

  // Clear the value when switching types
  discountValue.value = "";
}

// Handle Offer Type Change
function handleOfferTypeChange() {
  const offerType = document.getElementById("offerTypeSelect").value;
  const productSection = document.getElementById("productSelectionSection");
  const brandSection = document.getElementById("brandSelectionSection");
  const productIDs = document.getElementById("productIDs");
  const brandID = document.getElementById("brandID");

  if (offerType === "product") {
    productSection.classList.remove("hidden");
    brandSection.classList.add("hidden");
    productIDs.required = true;
    brandID.required = false;
    brandID.value = "";
    currentOfferType = "product";
  } else if (offerType === "brand") {
    productSection.classList.add("hidden");
    brandSection.classList.remove("hidden");
    productIDs.required = false;
    brandID.required = true;
    clearAllProducts();
    currentOfferType = "brand";
  } else {
    productSection.classList.add("hidden");
    brandSection.classList.add("hidden");
    productIDs.required = false;
    brandID.required = false;
  }
}

// Product Search
function searchProducts(query) {
  clearTimeout(searchTimeout);

  const resultsDiv = document.getElementById("productSearchResults");

  if (!query || query.trim().length < 2) {
    resultsDiv.classList.remove("show");
    resultsDiv.innerHTML = "";
    return;
  }

  // Show loading state
  resultsDiv.innerHTML =
    '<div class="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-md m-2">Searching...</div>';
  resultsDiv.classList.add("show");

  searchTimeout = setTimeout(async () => {
    try {
      console.log("Searching for:", query);
      const response = await axios.get(
        `/admin/products/search?q=${encodeURIComponent(query)}`
      );
      console.log("Search response:", response.data);

      if (response.data.success && response.data.products) {
        displayProductResults(response.data.products);
      } else {
        resultsDiv.innerHTML =
          '<div class="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-md m-2">No products found</div>';
        resultsDiv.classList.add("show");
      }
    } catch (error) {
      console.error("Product search error:", error);
      resultsDiv.innerHTML =
        '<div class="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-md m-2">Error searching products</div>';
      resultsDiv.classList.add("show");
    }
  }, 300);
}

function displayProductResults(products) {
  const resultsDiv = document.getElementById("productSearchResults");

  console.log("Displaying products:", products);

  if (!products || products.length === 0) {
    resultsDiv.innerHTML =
      '<div class="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-md m-2">No products found</div>';
    resultsDiv.classList.add("show");
    return;
  }

  const html = products
    .map((product) => {
      // Escape quotes in JSON for onclick
      const productJson = JSON.stringify(product).replace(/"/g, "&quot;");
      return `
      <div class="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50" 
           onclick='selectProduct(${productJson})'>
        <div class="w-12 h-12 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
          <img src="${product.image || "/images/placeholder-product.png"}" 
               alt="${product.name}" 
               onerror="this.src='/images/placeholder-product.png'"
               class="w-full h-full object-cover">
        </div>
        <div class="flex-1">
          <div class="font-semibold text-gray-900 mb-0.5">${product.name}</div>
          <div class="text-xs text-gray-500">${
            product.brandID?.brandName || "No Brand"
          } • ₹${product.minPrice?.toLocaleString("en-IN") || "N/A"}</div>
        </div>
      </div>
    `;
    })
    .join("");

  resultsDiv.innerHTML = html;
  resultsDiv.classList.add("show");
  console.log("Results displayed, show class added");
}

function selectProduct(product) {
  // Check if product is already selected
  const isAlreadySelected = selectedProducts.some((p) => p._id === product._id);

  if (isAlreadySelected) {
    showToast("Product already selected", "error");
    return;
  }

  // Add to selected products array
  selectedProducts.push(product);

  // Update UI
  renderSelectedProducts();

  // Clear and hide search results
  document.getElementById("productSearch").value = "";
  document.getElementById("productSearchResults").innerHTML = "";
  document.getElementById("productSearchResults").classList.remove("show");
}

function renderSelectedProducts() {
  const container = document.getElementById("selectedProductsContainer");
  const listDiv = document.getElementById("selectedProductsList");
  const countSpan = document.querySelector(".selected-count");
  const hiddenInput = document.getElementById("productIDs");

  if (selectedProducts.length === 0) {
    container.classList.add("hidden");
    hiddenInput.value = "";
    return;
  }

  // Show container
  container.classList.remove("hidden");

  // Update count
  countSpan.textContent = `${selectedProducts.length} product${
    selectedProducts.length !== 1 ? "s" : ""
  } selected`;

  // Update hidden input with comma-separated IDs
  hiddenInput.value = selectedProducts.map((p) => p._id).join(",");

  // Render list
  const html = selectedProducts
    .map(
      (product, index) => `
    <div class="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50">
      <div class="flex items-center gap-3 flex-1">
        <div class="w-12 h-12 rounded-md overflow-hidden border border-gray-200 flex-shrink-0">
          <img src="${product.image || "/images/placeholder-product.png"}" 
               alt="${product.name}" 
               onerror="this.src='/images/placeholder-product.png'"
               class="w-full h-full object-cover">
        </div>
        <div class="flex-1">
          <div class="font-semibold text-gray-900 mb-0.5 text-sm">${
            product.name
          }</div>
          <div class="text-xs text-gray-500">${
            product.brandID?.brandName || "No Brand"
          } • ₹${product.minPrice?.toLocaleString("en-IN") || "N/A"}</div>
        </div>
      </div>
      <button type="button" 
              class="w-8 h-8 flex items-center justify-center border-none rounded-md cursor-pointer transition-all bg-yellow-50 text-yellow-600 flex-shrink-0 hover:bg-yellow-400 hover:text-white" 
              onclick="removeProduct(${index})" 
              title="Remove">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
  `
    )
    .join("");

  listDiv.innerHTML = html;
}

function removeProduct(index) {
  selectedProducts.splice(index, 1);
  renderSelectedProducts();
}

function clearAllProducts() {
  selectedProducts = [];
  renderSelectedProducts();
  document.getElementById("productSearch").value = "";
  document.getElementById("productSearchResults").innerHTML = "";
  document.getElementById("productSearchResults").classList.remove("show");
}

// Form Submission
document.getElementById("offerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const offerId = document.getElementById("offerId").value;
  const offerType = document.getElementById("offerTypeSelect").value;
  const productIDs = document.getElementById("productIDs").value;
  const brandID = document.getElementById("brandID").value;
  const offerName = document.getElementById("offerName").value.trim();
  const discountType = document.getElementById("discountType").value;
  const discountValue = parseInt(
    document.getElementById("discountValue").value
  );
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const isActive = document.getElementById("isActive").value === "true";

  // Validation
  if (!offerType) {
    showToast("Please select an offer type", "error");
    return;
  }

  if (
    offerType === "product" &&
    (!productIDs || selectedProducts.length === 0)
  ) {
    showToast("Please select at least one product", "error");
    return;
  }

  if (offerType === "brand" && !brandID) {
    showToast("Please select a brand", "error");
    return;
  }

  if (!discountType) {
    showToast("Please select a discount type", "error");
    return;
  }

  if (!discountValue || discountValue < 1) {
    showToast("Please enter a valid discount value", "error");
    return;
  }

  if (
    discountType === "percentage" &&
    (discountValue < 1 || discountValue > 90)
  ) {
    showToast("Percentage discount must be between 1% and 90%", "error");
    return;
  }

  if (new Date(startDate) >= new Date(endDate)) {
    showToast("End date must be after start date", "error");
    return;
  }

  // Prepare data
  const offerData = {
    offerType,
    offerName,
    discountType,
    discountValue,
    startDate,
    endDate,
    isActive,
  };

  if (offerType === "product") {
    offerData.productID = productIDs.split(","); // Send as array
  } else {
    offerData.brandID = brandID;
  }

  try {
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';

    let response;
    if (offerId) {
      // Update existing offer
      response = await axios.put(`/admin/offers/${offerId}`, offerData);
    } else {
      // Create new offer
      response = await axios.post("/admin/offers", offerData);
    }

    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.reload();
    }
  } catch (error) {
    console.error("Offer save error:", error);
    showToast(error.response?.data?.message || "Failed to save offer", "error");
  } finally {
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = false;
    submitBtn.innerHTML =
      '<i class="bi bi-check-circle"></i> <span id="submitBtnText">Save Offer</span>';
  }
});

// Edit Offer
async function editOffer(offerId) {
  try {
    const response = await axios.get(`/admin/offers/${offerId}`);

    if (response.data.success) {
      const offer = response.data.offer;

      // Open modal
      const modal = document.getElementById("offerModal");
      modal.classList.add("show");

      // Set modal title
      document.getElementById("modalTitle").textContent = "Edit Offer";
      document.getElementById("submitBtnText").textContent = "Update Offer";

      // Fill form
      document.getElementById("offerId").value = offer._id;
      document.getElementById("offerTypeSelect").value = offer.offerType;
      document.getElementById("offerName").value = offer.offerName;
      document.getElementById("discountType").value = offer.discountType;
      handleDiscountTypeChange();
      document.getElementById("discountValue").value = offer.discountValue;
      document.getElementById("startDate").value = new Date(offer.startDate)
        .toISOString()
        .split("T")[0];
      document.getElementById("endDate").value = new Date(offer.endDate)
        .toISOString()
        .split("T")[0];
      document.getElementById("isActive").value = offer.isActive.toString();

      // Handle offer type specific fields
      handleOfferTypeChange();

      if (offer.offerType === "product" && offer.productID) {
        // Handle single product (for backward compatibility)
        if (!Array.isArray(offer.productID)) {
          offer.productID = [offer.productID];
        }

        // Load multiple products
        selectedProducts = offer.productID.map((p) => ({
          _id: p._id,
          name: p.name,
          image: p.image,
          brandID: p.brandID,
          minPrice: p.minPrice,
        }));

        renderSelectedProducts();
      } else if (offer.offerType === "brand" && offer.brandID) {
        document.getElementById("brandID").value = offer.brandID._id;
      }
    }
  } catch (error) {
    console.error("Edit offer error:", error);
    showToast("Failed to load offer details", "error");
  }
}

// Toggle Offer Status (with Global Confirm Modal)
async function toggleOfferStatus(offerId, currentStatus) {
  const action = currentStatus ? "deactivate" : "activate";

  const proceed = async () => {
    try {
      const response = await axios.patch(
        `/admin/offers/${offerId}/toggle-status`
      );

      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.reload();
      }
    } catch (error) {
      console.error("Toggle status error:", error);
      showToast(
        error.response?.data?.message || "Failed to update status",
        "error"
      );
    }
  };

  // ✅ GLOBAL CONFIRM MODAL
  openConfirmModal({
    title: currentStatus ? "Deactivate Offer" : "Activate Offer",
    message: currentStatus
      ? "Are you sure you want to deactivate this offer?"
      : "Do you want to activate this offer?",
    onConfirm: proceed,
  });
}

// Delete Offer (with Global Confirm Modal)
async function deleteOffer(offerId) {
  const proceed = async () => {
    try {
      const response = await axios.delete(`/admin/offers/${offerId}`);

      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.reload();
      }
    } catch (error) {
      console.error("Delete offer error:", error);
      showToast(
        error.response?.data?.message || "Failed to delete offer",
        "error"
      );
    }
  };

  // ✅ GLOBAL CONFIRM MODAL (Danger action)
  openConfirmModal({
    title: "Delete Offer",
    message:
      "Are you sure you want to delete this offer? This action cannot be undone.",
    onConfirm: proceed,
  });
}

// Tab Switching
function switchTab(type) {
  const url = new URL(window.location.href);
  url.searchParams.set("type", type);
  url.searchParams.set("page", "1");
  window.location.href = url.toString();
}

// Search and Filters
function handleSearch() {
  clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    applyFilters();
  }, 500);
}

function clearSearch() {
  document.getElementById("searchInput").value = "";
  applyFilters();
}

function applyFilters() {
  const url = new URL(window.location.href);
  const searchQuery = document.getElementById("searchInput").value.trim();
  const statusFilter = document.getElementById("statusFilter").value;

  // Update URL params
  if (searchQuery) {
    url.searchParams.set("search", searchQuery);
  } else {
    url.searchParams.delete("search");
  }

  if (statusFilter) {
    url.searchParams.set("status", statusFilter);
  } else {
    url.searchParams.delete("status");
  }

  // Reset to page 1 when filtering
  url.searchParams.set("page", "1");

  window.location.href = url.toString();
}

// Pagination
function changePage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
}

// Toast Notification Helper
function showToast(message, type = "success") {
  const bgColor = type === "success" ? "#00b09b" : "#e74c3c";

  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",
    backgroundColor: bgColor,
    stopOnFocus: true,
  }).showToast();
}

// Date validation - ensure end date is after start date
document.getElementById("startDate")?.addEventListener("change", function () {
  const startDate = this.value;
  document.getElementById("endDate").min = startDate;

  const endDate = document.getElementById("endDate").value;
  if (endDate && endDate <= startDate) {
    document.getElementById("endDate").value = "";
  }
});
