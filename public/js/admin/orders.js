function changePage(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.location.href = url.toString();
}

function applyFilters() {
  const url = new URL(window.location);

  const status = document.getElementById("statusFilter").value;
  const paymentStatus = document.getElementById("paymentStatusFilter").value;
  const sort = document.getElementById("sortFilter").value;

  if (status) {
    url.searchParams.set("status", status);
  } else {
    url.searchParams.delete("status");
  }

  if (paymentStatus) {
    url.searchParams.set("paymentStatus", paymentStatus);
  } else {
    url.searchParams.delete("paymentStatus");
  }

  if (sort) {
    url.searchParams.set("sort", sort);
  } else {
    url.searchParams.delete("sort");
  }

  url.searchParams.set("page", 1);
  window.location.href = url.toString();
}

let searchTimeout;
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById("searchInput").value;
    const url = new URL(window.location);

    if (searchTerm) {
      url.searchParams.set("search", searchTerm);
    } else {
      url.searchParams.delete("search");
    }

    url.searchParams.set("page", 1);
    window.location.href = url.toString();
  }, 500);
}

// Clear search only
function clearSearch() {
  const url = new URL(window.location);
  url.searchParams.delete("search");
  window.location.href = url.toString();
}

// Clear all filters but keep search
function clearAllFilters() {
  const url = new URL(window.location);
  const searchQuery = url.searchParams.get('search');
  
  url.searchParams.delete('status');
  url.searchParams.delete('paymentStatus');
  url.searchParams.delete('sort');
  url.searchParams.set('page', 1);
  
  window.location.href = url.toString();
}

// Clear everything (filters + search)
function clearAllFiltersAndSearch() {
  window.location.href = window.location.pathname;
}

// Remove individual filter
function removeFilter(filterType) {
  const url = new URL(window.location);
  url.searchParams.delete(filterType);
  url.searchParams.set('page', 1);
  window.location.href = url.toString();
}

function exportOrders() {
  window.location.href = "/admin/orders/export";
}