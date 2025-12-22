// /public/js/admin/banners.js

// Initialize Sortable for drag and drop
document.addEventListener('DOMContentLoaded', function() {
  const bannersContainer = document.getElementById('banners-container');
  
  if (bannersContainer && bannersContainer.children.length > 0) {
    new Sortable(bannersContainer, {
      animation: 150,
      handle: '.cursor-move',
      ghostClass: 'opacity-50',
      dragClass: 'shadow-2xl',
      onEnd: async function(evt) {
        // Get all banner items in new order
        const bannerItems = Array.from(bannersContainer.children);
        const newOrder = bannerItems.map((item, index) => ({
          id: item.dataset.bannerId,
          order: index + 1
        }));

        try {
          const response = await axios.post('/admin/banners/reorder', {
            banners: newOrder
          });

          if (response.data.success) {
            Toastify({
              text: 'Banner order updated successfully',
              duration: 3000,
              gravity: "bottom",
              position: "right",
              style: {
                background: "linear-gradient(to right, #00b09b, #96c93d)",
              },
              close: true,
            }).showToast();

            // Update order badges
            bannerItems.forEach((item, index) => {
              const badge = item.querySelector('.bg-blue-500');
              if (badge) {
                badge.textContent = `#${index + 1}`;
              }
            });
          }
        } catch (error) {
          console.error('Error updating banner order:', error);
          Toastify({
            text: error.response?.data?.message || 'Failed to update banner order',
            duration: 4000,
            gravity: "bottom",
            position: "right",
            style: { background: "#e74c3c" },
            close: true,
          }).showToast();
          
          // Revert the order on error
          location.reload();
        }
      }
    });
  }
});

// Toggle banner status (activate/deactivate)
async function toggleBannerStatus(bannerId, currentStatus) {
  try {
    const response = await axios.patch(`/admin/banners/${bannerId}/toggle`, {
      isActive: !currentStatus
    });

    if (response.data.success) {
      sessionStorage.setItem('toastSuccess', `Banner ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      window.location.reload();
    }
  } catch (error) {
    console.error('Error toggling banner status:', error);
    Toastify({
      text: error.response?.data?.message || 'Failed to update banner status',
      duration: 4000,
      gravity: "bottom",
      position: "right",
      style: { background: "#e74c3c" },
      close: true,
    }).showToast();
  }
}

// Confirm delete banner
function confirmDelete(bannerId) {
  openConfirmModal({
    title: "Delete Banner",
    message:
      "Are you sure you want to delete this banner? This action cannot be undone.",
    onConfirm: async () => {
      try {
        const response = await axios.delete(`/admin/banners/${bannerId}`);

        if (response.data.success) {
          sessionStorage.setItem("toastSuccess", "Banner deleted successfully");
          window.location.reload();
        }
      } catch (error) {
        Toastify({
          text: error.response?.data?.message || "Failed to delete banner",
          duration: 4000,
          gravity: "bottom",
          position: "right",
          style: { background: "#e74c3c" },
          close: true,
        }).showToast();
      }
    },
  });
}
