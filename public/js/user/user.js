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

    // --- Show/Hide Clear Button on Input ---
    const searchInputs = [
        document.getElementById("product-search-input"),
        document.getElementById("product-search-input-mobile")
    ];

    searchInputs.forEach(input => {
        if (input) {
            input.addEventListener("input", toggleClearButton);
        }
    });

    // Initial check for clear button visibility
    toggleClearButton();
});

let searchTimeout;

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(handleSearch, 1000); 
}

function handleSearch() {
    const searchInput = document.getElementById("product-search-input") || 
                        document.getElementById("product-search-input-mobile");
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

function clearSearch() {
    // Clear both desktop and mobile inputs
    const desktopInput = document.getElementById("product-search-input");
    const mobileInput = document.getElementById("product-search-input-mobile");
    
    if (desktopInput) desktopInput.value = "";
    if (mobileInput) mobileInput.value = "";

    // Hide clear buttons
    toggleClearButton();

    // Redirect to remove search parameter
    const currentPath = window.location.pathname;
    let url;

    if (currentPath.startsWith("/shop")) {
        url = new URL(window.location);
        url.searchParams.delete("search");
        url.searchParams.set("page", 1);
        window.location.href = url.href;
    } else {
        window.location.href = "/shop";
    }
}

function toggleClearButton() {
    const desktopInput = document.getElementById("product-search-input");
    const mobileInput = document.getElementById("product-search-input-mobile");
    const desktopClearBtn = document.getElementById("clear-search-btn");
    const mobileClearBtn = document.getElementById("clear-search-btn-mobile");

    // Toggle desktop clear button
    if (desktopInput && desktopClearBtn) {
        if (desktopInput.value.trim()) {
            desktopClearBtn.classList.remove("hidden");
        } else {
            desktopClearBtn.classList.add("hidden");
        }
    }

    // Toggle mobile clear button
    if (mobileInput && mobileClearBtn) {
        if (mobileInput.value.trim()) {
            mobileClearBtn.classList.remove("hidden");
        } else {
            mobileClearBtn.classList.add("hidden");
        }
    }
}