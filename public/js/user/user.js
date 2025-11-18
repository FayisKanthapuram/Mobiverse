
// /js/user/user.js

document.addEventListener("DOMContentLoaded", () => {
    
    // --- Mobile Menu Toggle ---
    const menuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    const menuIcon = menuBtn.querySelector('i');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener("click", () => {
            const isHidden = mobileMenu.classList.toggle("hidden");
            
            // Toggle icon
            if (isHidden) {
                menuIcon.classList.remove("bi-x");
                menuIcon.classList.add("bi-list");
            } else {
                menuIcon.classList.remove("bi-list");
                menuIcon.classList.add("bi-x");
            }
        });
    }

});

let searchTimeout;

function debounceSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(handleSearch, 1000); 
}

function handleSearch() {
  const searchInput = document.getElementById("product-search-input");
  if (!searchInput) return;

  const searchValue = searchInput.value.trim();

  // Determine the correct base URL
  const currentPath = window.location.pathname;
  let url;

  if (currentPath.startsWith("/shop")) {
    url = new URL(window.location);
  } else {
    url = new URL("/shop", window.location.origin);
  }

  const currentSearch = url.searchParams.get("search") || "";

  if (searchValue === currentSearch) return;

  if (searchValue) {
    url.searchParams.set("search", searchValue);
  } else {
    url.searchParams.delete("search");
  }

  url.searchParams.set("page", 1);
  window.location.href = url.href;
}
