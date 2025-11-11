// /js/user/home.js

document.addEventListener("DOMContentLoaded", () => {
    
    // --- Initialize Hero Carousel ---
    const heroSwiper = new Swiper("#hero-carousel", {
        // Optional parameters
        loop: true,
        effect: "fade", // Use fade effect
        fadeEffect: {
            crossFade: true
        },
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },

        // If we need pagination
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
        },

        // Navigation arrows
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
    });

    // --- Initialize Latest Products Carousel ---
    const latestSwiper = new Swiper("#latest-carousel", {
        slidesPerView: 1, // Start with 1 slide on mobile
        spaceBetween: 20, // Gap between slides

        // Navigation arrows
        navigation: {
            nextEl: "#latest-carousel .product-carousel-next",
            prevEl: "#latest-carousel .product-carousel-prev",
        },

        // Responsive breakpoints
        breakpoints: {
            // when window width is >= 640px (sm)
            640: {
                slidesPerView: 2,
            },
            // when window width is >= 768px (md)
            768: {
                slidesPerView: 3,
            },
            // when window width is >= 1024px (lg)
            1024: {
                slidesPerView: 4,
            },
        },
    });

    // --- Initialize Popular Products Carousel ---
    const popularSwiper = new Swiper("#popular-carousel", {
        slidesPerView: 1,
        spaceBetween: 20,
        
        navigation: {
            nextEl: "#popular-carousel .product-carousel-next",
            prevEl: "#popular-carousel .product-carousel-prev",
        },
        
        breakpoints: {
            640: {
                slidesPerView: 2,
            },
            768: {
                slidesPerView: 3,
            },
            1024: {
                slidesPerView: 4,
            },
        },
    });

});