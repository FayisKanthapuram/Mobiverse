// --- Carousel Script ---
document.querySelectorAll(".carousel-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const carouselId = button.dataset.carousel;
    const carousel = document.getElementById(carouselId);
    const cardWidth = carousel.querySelector(".product-card").offsetWidth + 20; // 20px for the gap

    if (button.classList.contains("prev")) {
      carousel.scrollBy({ left: -cardWidth, behavior: "smooth" });
    } else {
      carousel.scrollBy({ left: cardWidth, behavior: "smooth" });
    }
  });
});
