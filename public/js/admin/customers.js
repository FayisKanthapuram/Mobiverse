document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".unblock-btn , .block-btn").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      const target = event.currentTarget;
      const customerId = target.dataset.customerId;
      const isBlocked = target.dataset.isBlocked === "true";

      if (
        !isBlocked &&
        !confirm("Are you sure you want to block this customer?")
      )
        return;

      target.disabled = true;

      try {
        const response = await axios.patch(
          `/admin/customer/block/${customerId}`
        );
        if (response.data.success) {
          target.dataset.isBlocked = (!isBlocked).toString();
          let activeCount = Number(
            document.getElementById("active-count").textContent
          );
          let blockCount = Number(
            document.getElementById("block-count").textContent
          );

          if (isBlocked) {
            activeCount++;
            blockCount--;
            target.textContent = "Block";
            target.classList.replace("unblock-btn", "block-btn");
          } else {
            activeCount--;
            blockCount++;
            target.textContent = "Unblock";
            target.classList.replace("block-btn", "unblock-btn");
          }

          document.getElementById("active-count").textContent = activeCount;
          document.getElementById("block-count").textContent = blockCount;

          const badge = document.querySelector(
            `[data-customer-status][data-customer-id="${customerId}"]`
          );

          if (badge) {
            badge.innerHTML = isBlocked
              ? '<i class="fas fa-circle"></i> Active'
              : '<i class="fas fa-circle"></i> Blocked';
            badge.classList.toggle("status-blocked", !isBlocked);
            badge.classList.toggle("status-active", isBlocked);
          }

          Toastify({
            text: !isBlocked ? "Customer Blocked" : "Customer Unblocked",
            duration: 1500,
            gravity: "top",
            position: "right",
            style: {
              background: !isBlocked
                ? "#dc3545"
                : "linear-gradient(to right, #00b09b, #96c93d)",
            },
          }).showToast();
        }
      } catch (error) {
        console.log(error);
        Toastify({
          text: error.response?.data?.message || "Something went wrong",
          duration: 2000,
          gravity: "top",
          position: "right",
          style: { background: "#dc3545" },
        }).showToast();
      } finally {
        target.disabled = false;
      }
    });
  });
});

function changePage(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.location.href = url.href;
}

// Search functionality with debounce
let searchTimeout;
function handleSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const searchTerm = document.getElementById("search-input").value.trim();
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



// Apply filters
function applyFilters() {
  const url = new URL(window.location);

  const status = document.getElementById("status-filter").value;
  const sort = document.getElementById("sort-by").value;

  if (status && status !== "all") {
    url.searchParams.set("status", status);
  } else {
    url.searchParams.delete("status");
  }

  if (sort && sort !== "recent") {
    url.searchParams.set("sort", sort);
  } else {
    url.searchParams.delete("sort");
  }

  url.searchParams.set("page", 1);
  window.location.href = url.toString();
}

// Clear search only
function clearSearch() {
  const url = new URL(window.location);
  url.searchParams.delete("search");
  window.location.href = url.toString();
  url.searchParams.set("page", 1);
}

// Clear all filters but keep search
function clearAllFilters() {
  const url = new URL(window.location);
  const searchQuery = url.searchParams.get("search");

  url.searchParams.delete("status");
  url.searchParams.delete("sort");
  url.searchParams.set("page", 1);

  window.location.href = url.toString();
}

// Clear everything (filters + search)
function clearAllFiltersAndSearch() {
  window.location.href = window.location.pathname;
}

// Remove individual filter
function removeFilter(filterType) {
  const url = new URL(window.location);

  if (filterType === "status") {
    url.searchParams.delete("status");
  } else if (filterType === "sort") {
    url.searchParams.delete("sort");
  }

  url.searchParams.set("page", 1);
  window.location.href = url.toString();
}
