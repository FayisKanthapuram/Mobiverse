// // --- Simple Search Toggle Script ---
// document.addEventListener("DOMContentLoaded", () => {
//   const searchIcon = document.getElementById("search-toggle-btn-simple");
//   const searchInput = document.getElementById("search-input-simple");

//   if (searchIcon && searchInput) {
//     // --- Click the Search Icon ---
//     searchIcon.addEventListener("click", (e) => {
//       e.preventDefault();
//       searchIcon.classList.add("hidden"); // Hide icon
//       searchInput.classList.add("active"); // Show input
//       searchInput.focus(); // Focus input
//     });

//     // --- When the search input loses focus ---
//     searchInput.addEventListener("blur", () => {
//       // Only hide if it's empty
//       if (searchInput.value === "") {
//         searchInput.classList.remove("active"); // Hide input
//         searchIcon.classList.remove("hidden"); // Show icon
//       }
//     });

//     // Optional: Pressing Enter in search
//     searchInput.closest("form").addEventListener("submit", (e) => {
//       if (searchInput.value === "") {
//         e.preventDefault(); // Don't submit an empty form
//       }
//     });
//   }
// });

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