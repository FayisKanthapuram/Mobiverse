// Coupons Management JavaScript

let searchTimeout;
let selectedUsers = [];

// Modal Management
function openAddCouponModal() {
  const modal = document.getElementById("couponModal");
  const form = document.getElementById("couponForm");
  const modalTitle = document.getElementById("modalTitle");
  const submitBtnText = document.getElementById("submitBtnText");

  form.reset();
  document.getElementById("couponId").value = "";

  clearAllUsers();
  document.getElementById("specificUsersSection").style.display = "none";
  document.getElementById("discountValueGroup").classList.add("hidden");
  document.getElementById("maxDiscountGroup").style.display = "none";

  // Reset checkboxes
  document.getElementById("unlimitedPerUser").checked = false;
  document.getElementById("unlimitedTotal").checked = false;
  document.getElementById("usageLimitPerUser").disabled = false;
  document.getElementById("totalUsageLimit").disabled = false;

  modalTitle.textContent = "Add New Coupon";
  submitBtnText.textContent = "Create Coupon";

  modal.classList.add("show");

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("startDate").min = today;
  document.getElementById("endDate").min = today;
}

function closeCouponModal() {
  const modal = document.getElementById("couponModal");
  modal.classList.remove("show");
  document.getElementById("userSearchResults").innerHTML = "";
  document.getElementById("userSearchResults").classList.remove("show");
}

function closeViewModal() {
  const modal = document.getElementById("viewModal");
  modal.classList.remove("show");
}

window.onclick = function (event) {
  const couponModal = document.getElementById("couponModal");
  const viewModal = document.getElementById("viewModal");
  if (event.target === couponModal) {
    closeCouponModal();
  }
  if (event.target === viewModal) {
    closeViewModal();
  }
};

// Handle Type Change
function handleTypeChange() {
  const type = document.getElementById("type").value;
  const discountValueGroup = document.getElementById("discountValueGroup");
  const discountValue = document.getElementById("discountValue");
  const discountIcon = document.getElementById("discountIcon");
  const discountHelp = document.getElementById("discountHelp");
  const maxDiscountGroup = document.getElementById("maxDiscountGroup");

  // Reset values always
  discountValue.value = "";
  discountValue.removeAttribute("max");
  discountValue.required = false;
  maxDiscountGroup.style.display = "none";

  if (!type) {
    // Nothing selected → hide everything
    discountValueGroup.classList.add("hidden");
    return;
  }

  discountValueGroup.classList.remove("hidden");
  discountValue.required = true;

  if (type === "percentage") {
    discountIcon.textContent = "%";
    discountHelp.textContent = "Enter percentage (1–90%)";
    discountValue.placeholder = "e.g., 20";
    discountValue.min = "1";
    discountValue.max = "90";
    maxDiscountGroup.style.display = "block";
  }

  if (type === "fixed") {
    discountIcon.textContent = "₹";
    discountHelp.textContent = "Enter fixed amount";
    discountValue.placeholder = "e.g., 500";
    discountValue.min = "1";
  }
}

// Handle Eligibility Change
function handleEligibilityChange() {
  const eligibility = document.getElementById("userEligibility").value;
  const specificUsersSection = document.getElementById("specificUsersSection");
  const specificUsers = document.getElementById("specificUsers");

  if (eligibility === "specific") {
    specificUsersSection.style.display = "block";
    specificUsers.required = true;
  } else {
    specificUsersSection.style.display = "none";
    specificUsers.required = false;
    clearAllUsers();
  }
}

// Toggle Unlimited Checkboxes
function toggleUnlimitedPerUser() {
  const checkbox = document.getElementById("unlimitedPerUser");
  const input = document.getElementById("usageLimitPerUser");

  if (checkbox.checked) {
    input.value = "0";
    input.disabled = true;
  } else {
    input.disabled = false;
    input.value = "1";
    input.focus();
  }
}

function toggleUnlimitedTotal() {
  const checkbox = document.getElementById("unlimitedTotal");
  const input = document.getElementById("totalUsageLimit");

  if (checkbox.checked) {
    input.value = "0";
    input.disabled = true;
  } else {
    input.disabled = false;
    input.value = "100";
    input.focus();
  }
}

// User Search
function searchUsers(query) {
  clearTimeout(searchTimeout);

  const resultsDiv = document.getElementById("userSearchResults");

  if (!query || query.trim().length < 2) {
    resultsDiv.classList.remove("show");
    resultsDiv.innerHTML = "";
    return;
  }

  resultsDiv.innerHTML =
    '<div class="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-md m-2">Searching...</div>';
  resultsDiv.classList.add("show");

  searchTimeout = setTimeout(async () => {
    try {
      const response = await axios.get(
        `/admin/users/search?q=${encodeURIComponent(query)}`
      );

      if (response.data.success && response.data.users) {
        displayUserResults(response.data.users);
      } else {
        resultsDiv.innerHTML =
          '<div class="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-md m-2">No users found</div>';
        resultsDiv.classList.add("show");
      }
    } catch (error) {
      console.error("User search error:", error);
      resultsDiv.innerHTML =
        '<div class="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-md m-2">Error searching users</div>';
      resultsDiv.classList.add("show");
    }
  }, 300);
}

function displayUserResults(users) {
  const resultsDiv = document.getElementById("userSearchResults");

  if (!users || users.length === 0) {
    resultsDiv.innerHTML =
      '<div class="p-6 text-center text-gray-500 text-sm bg-gray-50 rounded-md m-2">No users found</div>';
    resultsDiv.classList.add("show");
    return;
  }

  const html = users
    .map((user) => {
      const userJson = JSON.stringify(user).replace(/"/g, "&quot;");
      const initials = user.username
        ? user.username.substring(0, 2).toUpperCase()
        : "U";
      return `
      <div class="flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 hover:bg-gray-50" 
           onclick='selectUser(${userJson})'>
        <div class="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 font-semibold flex-shrink-0">
          ${initials}
        </div>
        <div class="flex-1">
          <div class="font-semibold text-gray-900 mb-0.5">${
            user.username || "Unknown"
          }</div>
          <div class="text-xs text-gray-500">${user.email || ""}</div>
        </div>
      </div>
    `;
    })
    .join("");

  resultsDiv.innerHTML = html;
  resultsDiv.classList.add("show");
}

function selectUser(user) {
  const isAlreadySelected = selectedUsers.some((u) => u._id === user._id);

  if (isAlreadySelected) {
    showToast("User already selected", "error");
    return;
  }

  selectedUsers.push(user);
  renderSelectedUsers();

  document.getElementById("userSearch").value = "";
  document.getElementById("userSearchResults").innerHTML = "";
  document.getElementById("userSearchResults").classList.remove("show");
}

function renderSelectedUsers() {
  const container = document.getElementById("selectedUsersContainer");
  const listDiv = document.getElementById("selectedUsersList");
  const countSpan = document.querySelector(".selected-count");
  const hiddenInput = document.getElementById("specificUsers");

  if (selectedUsers.length === 0) {
    container.classList.add("hidden");
    hiddenInput.value = "";
    return;
  }

  container.classList.remove("hidden");
  countSpan.textContent = `${selectedUsers.length} user${
    selectedUsers.length !== 1 ? "s" : ""
  } selected`;
  hiddenInput.value = selectedUsers.map((u) => u._id).join(",");

  const html = selectedUsers
    .map((user, index) => {
      const initials = user.username
        ? user.username.substring(0, 2).toUpperCase()
        : "U";
      return `
      <div class="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50">
        <div class="flex items-center gap-3 flex-1">
          <div class="w-9 h-9 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 font-semibold text-sm flex-shrink-0">
            ${initials}
          </div>
          <div class="flex-1">
            <div class="font-semibold text-gray-900 mb-0.5 text-sm">${
              user.username || "Unknown"
            }</div>
            <div class="text-xs text-gray-500">${user.email || ""}</div>
          </div>
        </div>
        <button type="button" 
                class="w-8 h-8 flex items-center justify-center border-none rounded-md cursor-pointer transition-all bg-yellow-50 text-yellow-600 flex-shrink-0 hover:bg-yellow-400 hover:text-white" 
                onclick="removeUser(${index})" 
                title="Remove">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;
    })
    .join("");

  listDiv.innerHTML = html;
}

function removeUser(index) {
  selectedUsers.splice(index, 1);
  renderSelectedUsers();
}

function clearAllUsers() {
  selectedUsers = [];
  renderSelectedUsers();
  document.getElementById("userSearch").value = "";
  document.getElementById("userSearchResults").innerHTML = "";
  document.getElementById("userSearchResults").classList.remove("show");
}

// Close search results when clicking outside
document.addEventListener("click", function (event) {
  const searchWrapper = document.querySelector(".search-select-wrapper");
  const resultsDiv = document.getElementById("userSearchResults");

  if (searchWrapper && resultsDiv && !searchWrapper.contains(event.target)) {
    resultsDiv.classList.remove("show");
  }
});

// Form Submission
document.getElementById("couponForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const couponId = document.getElementById("couponId").value;
  const code = document.getElementById("code").value.trim().toUpperCase();
  const name = document.getElementById("name").value.trim();
  const description = document.getElementById("description").value.trim();
  const type = document.getElementById("type").value;
  const discountValue =
    parseInt(document.getElementById("discountValue").value) || 0;
  const maxDiscount =
    parseInt(document.getElementById("maxDiscount").value) || 0;
  const minPurchaseAmount = parseFloat(
    document.getElementById("minPurchaseAmount").value
  );
  const usageLimitPerUser = parseInt(
    document.getElementById("usageLimitPerUser").value
  );
  const totalUsageLimit = parseInt(
    document.getElementById("totalUsageLimit").value
  );
  const userEligibility = document.getElementById("userEligibility").value;
  const specificUsers = document.getElementById("specificUsers").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  const isActive = document.getElementById("isActive").value === "true";

  const couponData = {
    code,
    name,
    description,
    type,
    discountValue,
    maxDiscount: type === "percentage" ? maxDiscount : 0,
    minPurchaseAmount,
    usageLimitPerUser,
    totalUsageLimit,
    userEligibility,
    specificUsers:
      userEligibility === "specific" ? specificUsers.split(",") : [],
    startDate,
    endDate,
    isActive,
  };

  try {
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';

    let response;
    if (couponId) {
      response = await axios.put(`/admin/coupons/${couponId}`, couponData);
    } else {
      response = await axios.post("/admin/coupons", couponData);
    }

    if (response.data.success) {
      sessionStorage.setItem("toastSuccess", response.data.message);
      window.location.reload();
    }
  } catch (error) {
    console.error("Coupon save error:", error);
    showToast(
      error.response?.data?.message || "Failed to save coupon",
      "error"
    );
  } finally {
    const submitBtn = document.getElementById("submitBtn");
    submitBtn.disabled = false;
    submitBtn.innerHTML =
      '<i class="bi bi-check-circle"></i> <span id="submitBtnText">Save Coupon</span>';
  }
});

// Copy Coupon Code
function copyCouponCode(code) {
  navigator.clipboard
    .writeText(code)
    .then(() => {
      showToast(`Copied: ${code}`, "success");
    })
    .catch(() => {
      showToast("Failed to copy code", "error");
    });
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
  const typeFilter = document.getElementById("typeFilter").value;
  const statusFilter = document.getElementById("statusFilter").value;
  const sortFilter = document.getElementById("sortFilter").value;

  if (searchQuery) {
    url.searchParams.set("search", searchQuery);
  } else {
    url.searchParams.delete("search");
  }

  if (typeFilter) {
    url.searchParams.set("type", typeFilter);
  } else {
    url.searchParams.delete("type");
  }

  if (statusFilter) {
    url.searchParams.set("status", statusFilter);
  } else {
    url.searchParams.delete("status");
  }

  if (sortFilter && sortFilter !== "recent") {
    url.searchParams.set("sort", sortFilter);
  } else {
    url.searchParams.delete("sort");
  }

  url.searchParams.set("page", "1");
  window.location.href = url.toString();
}

// Pagination
function changePage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
}

// Toast Helper
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

// Date validation
document.getElementById("startDate")?.addEventListener("change", function () {
  const startDate = this.value;
  document.getElementById("endDate").min = startDate;

  const endDate = document.getElementById("endDate").value;
  if (endDate && endDate <= startDate) {
    document.getElementById("endDate").value = "";
  }
});

// Auto-uppercase coupon code
document.getElementById("code")?.addEventListener("input", function () {
  this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
});

// CRUD Operations

// Edit Coupon
async function editCoupon(couponId) {
  try {
    const response = await axios.get(`/admin/coupons/${couponId}`);

    if (response.data.success) {
      const coupon = response.data.coupon;

      const modal = document.getElementById("couponModal");
      modal.classList.add("show");

      document.getElementById("modalTitle").textContent = "Edit Coupon";
      document.getElementById("submitBtnText").textContent = "Update Coupon";

      // Fill form
      document.getElementById("couponId").value = coupon._id;
      document.getElementById("code").value = coupon.code;
      document.getElementById("name").value = coupon.name;
      document.getElementById("description").value = coupon.description || "";
      document.getElementById("type").value = coupon.type;
      handleTypeChange(); // Update UI based on type
      document.getElementById("discountValue").value = coupon.discountValue;
      document.getElementById("maxDiscount").value = coupon.maxDiscount || "";
      document.getElementById("minPurchaseAmount").value =
        coupon.minPurchaseAmount;
      document.getElementById("usageLimitPerUser").value =
        coupon.usageLimitPerUser;
      document.getElementById("totalUsageLimit").value = coupon.totalUsageLimit;
      document.getElementById("userEligibility").value = coupon.userEligibility;
      document.getElementById("startDate").value = new Date(coupon.startDate)
        .toISOString()
        .split("T")[0];
      document.getElementById("endDate").value = new Date(coupon.endDate)
        .toISOString()
        .split("T")[0];
      document.getElementById("isActive").value = coupon.isActive.toString();

      // Handle unlimited checkboxes
      if (coupon.usageLimitPerUser === 0) {
        document.getElementById("unlimitedPerUser").checked = true;
        document.getElementById("usageLimitPerUser").disabled = true;
      }

      if (coupon.totalUsageLimit === 0) {
        document.getElementById("unlimitedTotal").checked = true;
        document.getElementById("totalUsageLimit").disabled = true;
      }

      // Handle eligibility
      handleEligibilityChange();

      // Load specific users if applicable
      if (
        coupon.userEligibility === "specific" &&
        coupon.specificUsers &&
        coupon.specificUsers.length > 0
      ) {
        selectedUsers = coupon.specificUsers.map((u) => ({
          _id: u._id,
          username: u.username,
          email: u.email,
        }));
        renderSelectedUsers();
      }
    }
  } catch (error) {
    console.error("Edit coupon error:", error);
    showToast("Failed to load coupon details", "error");
  }
}

// View Coupon Details
async function viewCouponDetails(couponId) {
  try {
    const response = await axios.get(`/admin/coupons/${couponId}`);

    if (response.data.success) {
      const coupon = response.data.coupon;

      const modal = document.getElementById("viewModal");
      const content = document.getElementById("viewModalContent");

      const now = new Date();
      const end = new Date(coupon.endDate);
      let status = "Active";
      let statusColor = "#198754";
      if (!coupon.isActive) {
        status = "Inactive";
        statusColor = "#dc3545";
      } else if (now > end) {
        status = "Expired";
        statusColor = "#dc3545";
      } else if (
        coupon.totalUsageLimit > 0 &&
        coupon.currentUsageCount >= coupon.totalUsageLimit
      ) {
        status = "Used Up";
        statusColor = "#dc3545";
      }

      let discountDisplay = "";
      if (coupon.type === "percentage") {
        discountDisplay = `${coupon.discountValue}%`;
        if (coupon.maxDiscount)
          discountDisplay += ` (Max: ₹${coupon.maxDiscount})`;
      } else {
        discountDisplay = `₹${coupon.discountValue}`;
      }

      let eligibilityDisplay = "All Users";
      if (coupon.userEligibility === "new_users") {
        eligibilityDisplay = "New Users Only";
      } else if (coupon.userEligibility === "specific") {
        eligibilityDisplay = `${
          coupon.specificUsers?.length || 0
        } Specific Users`;
      }

      content.innerHTML = `
        <div class="space-y-4">
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Coupon Code:</span>
            <span class="text-right"><strong class="font-mono text-blue-600 text-lg">${
              coupon.code
            }</strong></span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Name:</span>
            <span class="text-right text-gray-900">${coupon.name}</span>
          </div>
          ${
            coupon.description
              ? `
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Description:</span>
            <span class="text-right text-gray-900">${coupon.description}</span>
          </div>
          `
              : ""
          }
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Type:</span>
            <span class="text-right text-gray-900">${coupon.type.toUpperCase()}</span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Discount:</span>
            <span class="text-right"><strong class="text-gray-900">${discountDisplay}</strong></span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Min Purchase:</span>
            <span class="text-right text-gray-900">₹${coupon.minPurchaseAmount.toLocaleString(
              "en-IN"
            )}</span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Usage per User:</span>
            <span class="text-right text-gray-900">${
              coupon.usageLimitPerUser === 0
                ? "Unlimited"
                : coupon.usageLimitPerUser
            }</span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Total Usage:</span>
            <span class="text-right text-gray-900">${
              coupon.currentUsageCount || 0
            } / ${
        coupon.totalUsageLimit === 0 ? "Unlimited" : coupon.totalUsageLimit
      }</span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Eligibility:</span>
            <span class="text-right text-gray-900">${eligibilityDisplay}</span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Valid From:</span>
            <span class="text-right text-gray-900">${new Date(
              coupon.startDate
            ).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Valid Until:</span>
            <span class="text-right text-gray-900">${new Date(
              coupon.endDate
            ).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</span>
          </div>
          <div class="flex justify-between py-3 border-b border-gray-200">
            <span class="font-semibold text-gray-700">Status:</span>
            <span class="text-right"><strong style="color: ${statusColor};">${status}</strong></span>
          </div>
          <div class="flex justify-between py-3">
            <span class="font-semibold text-gray-700">Created:</span>
            <span class="text-right text-gray-900">${new Date(
              coupon.createdAt
            ).toLocaleString("en-IN")}</span>
          </div>
        </div>
      `;

      modal.classList.add("show");
    }
  } catch (error) {
    console.error("View coupon error:", error);
    showToast("Failed to load coupon details", "error");
  }
}

// Toggle Coupon Status (with Global Confirm Modal)
async function toggleCouponStatus(couponId, currentStatus) {
  const action = currentStatus ? "deactivate" : "activate";

  const proceed = async () => {
    try {
      const response = await axios.patch(
        `/admin/coupons/${couponId}/toggle-status`
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
    title: currentStatus ? "Deactivate Coupon" : "Activate Coupon",
    message: currentStatus
      ? "Are you sure you want to deactivate this coupon?"
      : "Do you want to activate this coupon?",
    onConfirm: proceed,
  });
}

// Delete Coupon (with Global Confirm Modal)
async function deleteCoupon(couponId) {
  const proceed = async () => {
    try {
      const response = await axios.delete(`/admin/coupons/${couponId}`);

      if (response.data.success) {
        sessionStorage.setItem("toastSuccess", response.data.message);
        window.location.reload();
      }
    } catch (error) {
      console.error("Delete coupon error:", error);
      showToast(
        error.response?.data?.message || "Failed to delete coupon",
        "error"
      );
    }
  };

  // ✅ GLOBAL CONFIRM MODAL (Danger action)
  openConfirmModal({
    title: "Delete Coupon",
    message:
      "Are you sure you want to delete this coupon? This action cannot be undone.",
    onConfirm: proceed,
  });
}

// Export Coupons
async function exportCoupons() {
  try {
    showToast("Preparing export...", "success");

    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.set("export", "true");

    window.location.href = `/admin/coupons/export?${params.toString()}`;
  } catch (error) {
    console.error("Export error:", error);
    showToast("Failed to export coupons", "error");
  }
}
