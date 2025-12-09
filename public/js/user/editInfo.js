let cropper = null;
let selectedFile = null;

// Profile Picture Input Change
document.getElementById('profilePictureInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.match('image.*')) {
    alert('Please select an image file');
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  selectedFile = file;
  const reader = new FileReader();
  
  reader.onload = function(event) {
    const cropperImage = document.getElementById('cropperImage');
    cropperImage.src = event.target.result;
    
    // Show modal
    document.getElementById('cropperModal').classList.remove('hidden');
    document.getElementById('cropperModal').classList.add('flex');
    
    // Initialize Cropper
    if (cropper) {
      cropper.destroy();
    }
    
    cropper = new Cropper(cropperImage, {
      aspectRatio: 1,
      viewMode: 2,
      dragMode: 'move',
      autoCropArea: 1,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
  };
  
  reader.readAsDataURL(file);
});

// Crop Button
document.getElementById('cropBtn').addEventListener('click', function() {
  if (!cropper) return;
  
  const canvas = cropper.getCroppedCanvas({
    width: 400,
    height: 400,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
  });
  
  canvas.toBlob(function(blob) {
    // Create new file from blob
    const croppedFile = new File([blob], selectedFile.name, {
      type: 'image/jpeg',
      lastModified: Date.now()
    });
    
    // Update file input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(croppedFile);
    document.getElementById('profilePictureInput').files = dataTransfer.files;
    
    // Update preview
    const preview = document.getElementById('profilePreview');
    const croppedImageUrl = canvas.toDataURL('image/jpeg');
    preview.src = croppedImageUrl;
    
    // Close modal
    closeCropperModal();
  }, 'image/jpeg', 0.95);
});

// Close Cropper Modal
function closeCropperModal() {
  document.getElementById('cropperModal').classList.add('hidden');
  document.getElementById('cropperModal').classList.remove('flex');
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

document.getElementById('closeCropperBtn').addEventListener('click', closeCropperModal);
document.getElementById('cancelCropBtn').addEventListener('click', closeCropperModal);

const DEFAULT_AVATAR = "https://res.cloudinary.com/dlqronc2z/image/upload/v1765254735/user-avatar_wyifzm.jpg"
// Remove Photo Button
document.getElementById('removePhotoBtn').addEventListener('click', function() {
  if (confirm('Are you sure you want to remove your profile picture?')) {
    // Clear file input
    document.getElementById('profilePictureInput').value = '';
    
    // Reset preview to default avatar
    const preview = document.getElementById('profilePreview');
    preview.src = DEFAULT_AVATAR;
    
    // Add hidden input to indicate photo removal
    let removeInput = document.querySelector('input[name="removePhoto"]');
    if (!removeInput) {
      removeInput = document.createElement('input');
      removeInput.type = 'hidden';
      removeInput.name = 'removePhoto';
      removeInput.value = 'true';
      document.getElementById('editProfileForm').appendChild(removeInput);
    }
  }
});

// Form Validation
document.getElementById('editProfileForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  try {
    const response = await axios.patch(`/edit-info`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.success) {
      Toastify({
        text: response.data.message,
        duration: 1000,
        gravity: "top",
        position: "right",
        style: { background: "linear-gradient(to right, #00b09b, #96c93d)" },
      }).showToast();
      setTimeout(() => window.location.href='/personal-info', 1200);
    }
  } catch (error) {
    Toastify({
      text: error.response?.data?.message || "Failed to update personal information",
      duration: 2000,
      gravity: "top",
      position: "right",
      style: { background: "#e74c3c" },
    }).showToast();
  }
});