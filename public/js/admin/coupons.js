// Coupons Management JavaScript

let searchTimeout;
let selectedUsers = [];

// Modal Management
function openAddCouponModal() {
  const modal = document.getElementById('couponModal');
  const form = document.getElementById('couponForm');
  const modalTitle = document.getElementById('modalTitle');
  const submitBtnText = document.getElementById('submitBtnText');
  
  form.reset();
  document.getElementById('couponId').value = '';
  
  clearAllUsers();
  document.getElementById('specificUsersSection').style.display = 'none';
  document.getElementById('discountValueGroup').style.display = 'flex';
  document.getElementById('maxDiscountGroup').style.display = 'none';
  
  modalTitle.textContent = 'Add New Coupon';
  submitBtnText.textContent = 'Create Coupon';
  
  modal.classList.add('show');
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').min = today;
  document.getElementById('endDate').min = today;
}

function closeCouponModal() {
  const modal = document.getElementById('couponModal');
  modal.classList.remove('show');
  document.getElementById('userSearchResults').innerHTML = '';
  document.getElementById('userSearchResults').classList.remove('show');
}

function closeViewModal() {
  const modal = document.getElementById('viewModal');
  modal.classList.remove('show');
}

window.onclick = function(event) {
  const couponModal = document.getElementById('couponModal');
  const viewModal = document.getElementById('viewModal');
  if (event.target === couponModal) {
    closeCouponModal();
  }
  if (event.target === viewModal) {
    closeViewModal();
  }
}

// Handle Type Change
function handleTypeChange() {
  const type = document.getElementById('type').value;
  const discountValueGroup = document.getElementById('discountValueGroup');
  const discountValue = document.getElementById('discountValue');
  const discountIcon = document.getElementById('discountIcon');
  const discountHelp = document.getElementById('discountHelp');
  const maxDiscountGroup = document.getElementById('maxDiscountGroup');
  
  if (type === 'percentage') {
    discountValueGroup.style.display = 'block';
    maxDiscountGroup.style.display = 'block';
    discountIcon.textContent = '%';
    discountHelp.textContent = 'Enter percentage (1-90%)';
    discountValue.placeholder = 'e.g., 20';
    discountValue.max = '90';
    discountValue.min = '1';
    discountValue.required = true;
  } else if (type === 'fixed') {
    discountValueGroup.style.display = 'block';
    maxDiscountGroup.style.display = 'none';
    discountIcon.textContent = '₹';
    discountHelp.textContent = 'Enter fixed amount';
    discountValue.placeholder = 'e.g., 500';
    discountValue.removeAttribute('max');
    discountValue.min = '1';
    discountValue.required = true;
  } else if (type === 'free_shipping') {
    discountValueGroup.style.display = 'none';
    maxDiscountGroup.style.display = 'none';
    discountValue.required = false;
    discountValue.value = '0';
  }
}

// Handle Eligibility Change
function handleEligibilityChange() {
  const eligibility = document.getElementById('userEligibility').value;
  const specificUsersSection = document.getElementById('specificUsersSection');
  const specificUsers = document.getElementById('specificUsers');
  
  if (eligibility === 'specific') {
    specificUsersSection.style.display = 'block';
    specificUsers.required = true;
  } else {
    specificUsersSection.style.display = 'none';
    specificUsers.required = false;
    clearAllUsers();
  }
}

// Toggle Unlimited Checkboxes
function toggleUnlimitedPerUser() {
  const checkbox = document.getElementById('unlimitedPerUser');
  const input = document.getElementById('usageLimitPerUser');
  
  if (checkbox.checked) {
    input.value = '0';
    input.disabled = true;
  } else {
    input.disabled = false;
    input.value = '1';
    input.focus();
  }
}

function toggleUnlimitedTotal() {
  const checkbox = document.getElementById('unlimitedTotal');
  const input = document.getElementById('totalUsageLimit');
  
  if (checkbox.checked) {
    input.value = '0';
    input.disabled = true;
  } else {
    input.disabled = false;
    input.value = '100';
    input.focus();
  }
}

// User Search
function searchUsers(query) {
  clearTimeout(searchTimeout);
  
  const resultsDiv = document.getElementById('userSearchResults');
  
  if (!query || query.trim().length < 2) {
    resultsDiv.classList.remove('show');
    resultsDiv.innerHTML = '';
    return;
  }
  
  resultsDiv.innerHTML = '<div class="no-results">Searching...</div>';
  resultsDiv.classList.add('show');
  
  searchTimeout = setTimeout(async () => {
    try {
      const response = await axios.get(`/admin/users/search?q=${encodeURIComponent(query)}`);
      
      if (response.data.success && response.data.users) {
        displayUserResults(response.data.users);
      } else {
        resultsDiv.innerHTML = '<div class="no-results">No users found</div>';
        resultsDiv.classList.add('show');
      }
    } catch (error) {
      console.error('User search error:', error);
      resultsDiv.innerHTML = '<div class="no-results">Error searching users</div>';
      resultsDiv.classList.add('show');
    }
  }, 300);
}

function displayUserResults(users) {
  const resultsDiv = document.getElementById('userSearchResults');
  
  if (!users || users.length === 0) {
    resultsDiv.innerHTML = '<div class="no-results">No users found</div>';
    resultsDiv.classList.add('show');
    return;
  }
  
  const html = users.map(user => {
    const userJson = JSON.stringify(user).replace(/"/g, '&quot;');
    const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'U';
    return `
      <div class="search-result-item" onclick='selectUser(${userJson})'>
        <div class="search-result-avatar">${initials}</div>
        <div class="search-result-info">
          <div class="search-result-name">${user.username || 'Unknown'}</div>
          <div class="search-result-email">${user.email || ''}</div>
        </div>
      </div>
    `;
  }).join('');
  
  resultsDiv.innerHTML = html;
  resultsDiv.classList.add('show');
}

function selectUser(user) {
  const isAlreadySelected = selectedUsers.some(u => u._id === user._id);
  
  if (isAlreadySelected) {
    showToast('User already selected', 'error');
    return;
  }
  
  selectedUsers.push(user);
  renderSelectedUsers();
  
  document.getElementById('userSearch').value = '';
  document.getElementById('userSearchResults').innerHTML = '';
  document.getElementById('userSearchResults').classList.remove('show');
}

function renderSelectedUsers() {
  const container = document.getElementById('selectedUsersContainer');
  const listDiv = document.getElementById('selectedUsersList');
  const countSpan = document.querySelector('.selected-count');
  const hiddenInput = document.getElementById('specificUsers');
  
  if (selectedUsers.length === 0) {
    container.style.display = 'none';
    hiddenInput.value = '';
    return;
  }
  
  container.style.display = 'block';
  countSpan.textContent = `${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''} selected`;
  hiddenInput.value = selectedUsers.map(u => u._id).join(',');
  
  const html = selectedUsers.map((user, index) => {
    const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'U';
    return `
      <div class="selected-user-item">
        <div class="selected-user-info">
          <div class="selected-user-avatar">${initials}</div>
          <div class="selected-user-details">
            <div class="selected-user-name">${user.username || 'Unknown'}</div>
            <div class="selected-user-email">${user.email || ''}</div>
          </div>
        </div>
        <button type="button" class="btn-remove-user" onclick="removeUser(${index})" title="Remove">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;
  }).join('');
  
  listDiv.innerHTML = html;
}

function removeUser(index) {
  selectedUsers.splice(index, 1);
  renderSelectedUsers();
}

function clearAllUsers() {
  selectedUsers = [];
  renderSelectedUsers();
  document.getElementById('userSearch').value = '';
  document.getElementById('userSearchResults').innerHTML = '';
  document.getElementById('userSearchResults').classList.remove('show');
}

// Close search results when clicking outside
document.addEventListener('click', function(event) {
  const searchWrapper = document.querySelector('.search-select-wrapper');
  const resultsDiv = document.getElementById('userSearchResults');
  
  if (searchWrapper && resultsDiv && !searchWrapper.contains(event.target)) {
    resultsDiv.classList.remove('show');
  }
});

// Form Submission
document.getElementById('couponForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const couponId = document.getElementById('couponId').value;
  const code = document.getElementById('code').value.trim().toUpperCase();
  const name = document.getElementById('name').value.trim();
  const description = document.getElementById('description').value.trim();
  const type = document.getElementById('type').value;
  const discountValue = parseInt(document.getElementById('discountValue').value) || 0;
  const maxDiscount = parseInt(document.getElementById('maxDiscount').value) || 0;
  const minPurchaseAmount = parseFloat(document.getElementById('minPurchaseAmount').value);
  const usageLimitPerUser = parseInt(document.getElementById('usageLimitPerUser').value);
  const totalUsageLimit = parseInt(document.getElementById('totalUsageLimit').value);
  const userEligibility = document.getElementById('userEligibility').value;
  const specificUsers = document.getElementById('specificUsers').value;
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const isActive = document.getElementById('isActive').value === 'true';
  
  // Validation
  if (!code || code.length < 3) {
    showToast('Coupon code must be at least 3 characters', 'error');
    return;
  }
  
  if (!/^[A-Z0-9_]+$/.test(code)) {
    showToast('Coupon code can only contain letters, numbers, and underscores', 'error');
    return;
  }
  
  if (!type) {
    showToast('Please select a discount type', 'error');
    return;
  }
  
  if (type !== 'free_shipping' && (!discountValue || discountValue < 1)) {
    showToast('Please enter a valid discount value', 'error');
    return;
  }
  
  if (type === 'percentage' && (discountValue < 1 || discountValue > 90)) {
    showToast('Percentage discount must be between 1% and 90%', 'error');
    return;
  }
  
  if (type === 'percentage' && maxDiscount > 0 && maxDiscount < discountValue) {
    showToast('Maximum discount should be greater than discount percentage', 'error');
    return;
  }
  
  if (minPurchaseAmount < 0) {
    showToast('Minimum purchase amount cannot be negative', 'error');
    return;
  }
  
  if (userEligibility === 'specific' && (!specificUsers || selectedUsers.length === 0)) {
    showToast('Please select at least one user', 'error');
    return;
  }
  
  if (new Date(startDate) >= new Date(endDate)) {
    showToast('End date must be after start date', 'error');
    return;
  }
  
  const couponData = {
    code,
    name,
    description,
    type,
    discountValue: type === 'free_shipping' ? 0 : discountValue,
    maxDiscount: type === 'percentage' ? maxDiscount : 0,
    minPurchaseAmount,
    usageLimitPerUser,
    totalUsageLimit,
    userEligibility,
    specificUsers: userEligibility === 'specific' ? specificUsers.split(',') : [],
    startDate,
    endDate,
    isActive
  };
  
  try {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving...';
    
    let response;
    if (couponId) {
      response = await axios.put(`/admin/coupons/${couponId}`, couponData);
    } else {
      response = await axios.post('/admin/coupons', couponData);
    }
    
    if (response.data.success) {
      showToast(response.data.message, 'success');
      closeCouponModal();
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    console.error('Coupon save error:', error);
    showToast(error.response?.data?.message || 'Failed to save coupon', 'error');
  } finally {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> <span id="submitBtnText">Save Coupon</span>';
  }
});

// Copy Coupon Code
function copyCouponCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Copied: ${code}`, 'success');
  }).catch(() => {
    showToast('Failed to copy code', 'error');
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
  document.getElementById('searchInput').value = '';
  applyFilters();
}

function applyFilters() {
  const url = new URL(window.location.href);
  const searchQuery = document.getElementById('searchInput').value.trim();
  const typeFilter = document.getElementById('typeFilter').value;
  const statusFilter = document.getElementById('statusFilter').value;
  const sortFilter = document.getElementById('sortFilter').value;
  
  if (searchQuery) {
    url.searchParams.set('search', searchQuery);
  } else {
    url.searchParams.delete('search');
  }
  
  if (typeFilter) {
    url.searchParams.set('type', typeFilter);
  } else {
    url.searchParams.delete('type');
  }
  
  if (statusFilter) {
    url.searchParams.set('status', statusFilter);
  } else {
    url.searchParams.delete('status');
  }
  
  if (sortFilter && sortFilter !== 'recent') {
    url.searchParams.set('sort', sortFilter);
  } else {
    url.searchParams.delete('sort');
  }
  
  url.searchParams.set('page', '1');
  window.location.href = url.toString();
}

// Pagination
function changePage(page) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  window.location.href = url.toString();
}

// Toast Helper
function showToast(message, type = 'success') {
  const bgColor = type === 'success' ? '#00b09b' : '#e74c3c';
  
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    backgroundColor: bgColor,
    stopOnFocus: true
  }).showToast();
}

// Date validation
document.getElementById('startDate')?.addEventListener('change', function() {
  const startDate = this.value;
  document.getElementById('endDate').min = startDate;
  
  const endDate = document.getElementById('endDate').value;
  if (endDate && endDate <= startDate) {
    document.getElementById('endDate').value = '';
  }
});

// Auto-uppercase coupon code
document.getElementById('code')?.addEventListener('input', function() {
  this.value = this.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
});


////////////CRUD

// Coupons Management JavaScript - Part 2 (CRUD Operations)

// Edit Coupon
async function editCoupon(couponId) {
  try {
    const response = await axios.get(`/admin/coupons/${couponId}`);
    
    if (response.data.success) {
      const coupon = response.data.coupon;
      
      const modal = document.getElementById('couponModal');
      modal.classList.add('show');
      
      document.getElementById('modalTitle').textContent = 'Edit Coupon';
      document.getElementById('submitBtnText').textContent = 'Update Coupon';
      
      // Fill form
      document.getElementById('couponId').value = coupon._id;
      document.getElementById('code').value = coupon.code;
      document.getElementById('name').value = coupon.name;
      document.getElementById('description').value = coupon.description || '';
      document.getElementById('type').value = coupon.type;
      document.getElementById('discountValue').value = coupon.discountValue;
      document.getElementById('maxDiscount').value = coupon.maxDiscount || '';
      document.getElementById('minPurchaseAmount').value = coupon.minPurchaseAmount;
      document.getElementById('usageLimitPerUser').value = coupon.usageLimitPerUser;
      document.getElementById('totalUsageLimit').value = coupon.totalUsageLimit;
      document.getElementById('userEligibility').value = coupon.userEligibility;
      document.getElementById('startDate').value = new Date(coupon.startDate).toISOString().split('T')[0];
      document.getElementById('endDate').value = new Date(coupon.endDate).toISOString().split('T')[0];
      document.getElementById('isActive').value = coupon.isActive.toString();
      
      // Handle unlimited checkboxes
      if (coupon.usageLimitPerUser === 0) {
        document.getElementById('unlimitedPerUser').checked = true;
        document.getElementById('usageLimitPerUser').disabled = true;
      }
      
      if (coupon.totalUsageLimit === 0) {
        document.getElementById('unlimitedTotal').checked = true;
        document.getElementById('totalUsageLimit').disabled = true;
      }
      
      // Update type UI
      handleTypeChange();
      
      // Handle eligibility
      handleEligibilityChange();
      
      // Load specific users if applicable
      if (coupon.userEligibility === 'specific' && coupon.specificUsers && coupon.specificUsers.length > 0) {
        selectedUsers = coupon.specificUsers.map(u => ({
          _id: u._id,
          username: u.username,
          email: u.email
        }));
        renderSelectedUsers();
      }
    }
  } catch (error) {
    console.error('Edit coupon error:', error);
    showToast('Failed to load coupon details', 'error');
  }
}

// View Coupon Details
async function viewCouponDetails(couponId) {
  try {
    const response = await axios.get(`/admin/coupons/${couponId}`);
    
    if (response.data.success) {
      const coupon = response.data.coupon;
      
      const modal = document.getElementById('viewModal');
      const content = document.getElementById('viewModalContent');
      
      const now = new Date();
      const end = new Date(coupon.endDate);
      let status = 'Active';
      if (!coupon.isActive) status = 'Inactive';
      else if (now > end) status = 'Expired';
      else if (coupon.totalUsageLimit > 0 && coupon.currentUsageCount >= coupon.totalUsageLimit) status = 'Used Up';
      
      let discountDisplay = '';
      if (coupon.type === 'percentage') {
        discountDisplay = `${coupon.discountValue}%`;
        if (coupon.maxDiscount) discountDisplay += ` (Max: ₹${coupon.maxDiscount})`;
      } else if (coupon.type === 'fixed') {
        discountDisplay = `₹${coupon.discountValue}`;
      } else {
        discountDisplay = 'Free Shipping';
      }
      
      let eligibilityDisplay = 'All Users';
      if (coupon.userEligibility === 'new_users') {
        eligibilityDisplay = 'New Users Only';
      } else if (coupon.userEligibility === 'specific') {
        eligibilityDisplay = `${coupon.specificUsers?.length || 0} Specific Users`;
      }
      
      content.innerHTML = `
        <div class="detail-row">
          <span class="detail-label">Coupon Code:</span>
          <span class="detail-value"><strong style="font-family: monospace; color: #0d6efd; font-size: 1.1rem;">${coupon.code}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span class="detail-value">${coupon.name}</span>
        </div>
        ${coupon.description ? `
        <div class="detail-row">
          <span class="detail-label">Description:</span>
          <span class="detail-value">${coupon.description}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${coupon.type.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Discount:</span>
          <span class="detail-value"><strong>${discountDisplay}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Min Purchase:</span>
          <span class="detail-value">₹${coupon.minPurchaseAmount.toLocaleString('en-IN')}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Usage per User:</span>
          <span class="detail-value">${coupon.usageLimitPerUser === 0 ? 'Unlimited' : coupon.usageLimitPerUser}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Total Usage:</span>
          <span class="detail-value">${coupon.currentUsageCount || 0} / ${coupon.totalUsageLimit === 0 ? 'Unlimited' : coupon.totalUsageLimit}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Eligibility:</span>
          <span class="detail-value">${eligibilityDisplay}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Valid From:</span>
          <span class="detail-value">${new Date(coupon.startDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Valid Until:</span>
          <span class="detail-value">${new Date(coupon.endDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value"><strong style="color: ${status === 'Active' ? '#198754' : '#dc3545'};">${status}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Created:</span>
          <span class="detail-value">${new Date(coupon.createdAt).toLocaleString('en-IN')}</span>
        </div>
      `;
      
      modal.classList.add('show');
    }
  } catch (error) {
    console.error('View coupon error:', error);
    showToast('Failed to load coupon details', 'error');
  }
}

// Toggle Coupon Status
async function toggleCouponStatus(couponId, currentStatus) {
  const action = currentStatus ? 'deactivate' : 'activate';
  const confirmMsg = `Are you sure you want to ${action} this coupon?`;
  
  if (!confirm(confirmMsg)) return;
  
  try {
    const response = await axios.patch(`/admin/coupons/${couponId}/toggle-status`);
    
    if (response.data.success) {
      showToast(response.data.message, 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    console.error('Toggle status error:', error);
    showToast(error.response?.data?.message || 'Failed to update status', 'error');
  }
}

// Delete Coupon
async function deleteCoupon(couponId) {
  if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
    return;
  }
  
  try {
    const response = await axios.delete(`/admin/coupons/${couponId}`);
    
    if (response.data.success) {
      showToast(response.data.message, 'success');
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    console.error('Delete coupon error:', error);
    showToast(error.response?.data?.message || 'Failed to delete coupon', 'error');
  }
}

// Export Coupons
async function exportCoupons() {
  try {
    showToast('Preparing export...', 'success');
    
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    params.set('export', 'true');
    
    window.location.href = `/admin/coupons/export?${params.toString()}`;
  } catch (error) {
    console.error('Export error:', error);
    showToast('Failed to export coupons', 'error');
  }
}