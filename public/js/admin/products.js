document.addEventListener('DOMContentLoaded', () => {

    //================================================
    // 1. Modal Handling
    //================================================
    const addModal = document.getElementById('add-product-modal');
    const editModal = document.getElementById('edit-product-modal');
    const openAddModalBtn = document.getElementById('open-add-modal-btn');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');

    // Function to open a modal
    const openModal = (modal) => {
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    // Function to close a modal
    const closeModal = (modal) => {
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Open "Add Product" modal
    if (openAddModalBtn) {
        openAddModalBtn.addEventListener('click', () => {
            openModal(addModal);
            // Add a default first variant when opening the add modal
            if (document.getElementById('add-variant-list').childElementCount === 0) {
                addVariantForm('add');
            }
        });
    }

    // Close modals with any "close" button
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(addModal);
            closeModal(editModal);
        });
    });

    // Close modals by clicking on the overlay
    window.addEventListener('click', (e) => {
        if (e.target === addModal) {
            closeModal(addModal);
        }
        if (e.target === editModal) {
            closeModal(editModal);
        }
    });

    //================================================
    // 2. Accordion (Step) Handling
    //================================================
    document.querySelectorAll('.step-header').forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.fas');

            // Toggle active class on header
            header.classList.toggle('active');

            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
            
            // Icon rotation is handled by CSS .active class if you add it:
            // .step-header .fas { transition: transform 0.3s ease; }
            // .step-header.active .fas { transform: rotate(180deg); }
        });
    });

    //================================================
    // 3. Dynamic Variant Form Handling
    //================================================
    const variantTemplate = document.getElementById('variant-template');

    // Add new variant form
    const addVariantForm = (modalTypePrefix) => {
        if (!variantTemplate) return;

        const variantList = document.getElementById(`${modalTypePrefix}-variant-list`);
        if (!variantList) return;

        // Clone the template
        const newVariant = variantTemplate.content.cloneNode(true);
        const variantCount = variantList.children.length + 1;

        // Update the variant number
        newVariant.querySelector('.variant-number').textContent = variantCount;

        // Add event listeners for stock calculation
        newVariant.querySelector('.variant-stock').addEventListener('input', () => {
            updateTotalStock(modalTypePrefix);
        });
        
        // Add event listener for remove button
        newVariant.querySelector('.btn-remove-variant').addEventListener('click', (e) => {
            e.currentTarget.closest('.variant-form-section').remove();
            updateVariantNumbers(modalTypePrefix);
            updateTotalStock(modalTypePrefix);
        });

        variantList.appendChild(newVariant);
    };

    // Update variant numbers after one is removed
    const updateVariantNumbers = (modalTypePrefix) => {
        const variantList = document.getElementById(`${modalTypePrefix}-variant-list`);
        if (!variantList) return;

        variantList.querySelectorAll('.variant-form-section').forEach((variant, index) => {
            variant.querySelector('.variant-number').textContent = index + 1;
        });
    };

    // Update total stock count
    const updateTotalStock = (modalTypePrefix) => {
        const variantList = document.getElementById(`${modalTypePrefix}-variant-list`);
        const totalStockEl = document.getElementById(`${modalTypePrefix}-total-stock`);
        if (!variantList || !totalStockEl) return;

        let total = 0;
        variantList.querySelectorAll('.variant-stock').forEach(input => {
            total += parseInt(input.value) || 0;
        });

        totalStockEl.textContent = `${total} units`;
    };

    // Event listener for "Add Another Variant" button in ADD modal
    document.getElementById('add-variant-btn')?.addEventListener('click', () => {
        addVariantForm('add');
    });

    // Event listener for "Add Another Variant" button in EDIT modal
    document.getElementById('edit-add-variant-btn')?.addEventListener('click', () => {
        addVariantForm('edit');
    });


    //================================================
    // 4. "Edit Product" Data Loading (Frontend-Backend Bridge)
    //================================================
    document.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', async (e) => {
            const productId = e.currentTarget.dataset.productId;
            console.log(productId);
            
            // --- This is where you call your backend ---
            // As an AI, I can't make the backend call, but here is how you'd structure it.
            // You mentioned you use Axios, so you'd do something like this:
            /*
            try {
                const response = await axios.get(`/admin/api/products/${productId}`);
                const product = response.data;
                
                // Populate the "Edit" modal
                populateEditModal(product);
                
                // Open the modal
                openModal(editModal);

            } catch (error) {
                console.error('Failed to fetch product data:', error);
                alert('Could not load product data. Please try again.');
            }
            */
            
            // --- Placeholder ---
            // For testing, I'll use dummy data to show population.
            // Replace this with your real Axios call above.
            console.log(`Pretending to fetch data for product: ${productId}`);
            const dummyProduct = {
                _id: '67890fgh',
                name: 'Galaxy S24',
                brand: 'Samsung',
                description: 'Flagship Samsung phone with AI features',
                images: [
                    '/images/logo.png' // Use the actual image path from your backend
                ],
                isFeatured: false,
                status: 'Unlisted', // 'Listed' or 'Unlisted'
                variants: [
                    { _id: 'var1', regularPrice: 69999, salePrice: 69999, ram: '8GB', storage: '128GB', colour: 'Phantom Black', stockQuantity: 20 },
                    { _id: 'var2', regularPrice: 109999, salePrice: 109999, ram: '12GB', storage: '512GB', colour: 'Cream', stockQuantity: 32 }
                ]
            };
            populateEditModal(dummyProduct);
            openModal(editModal);
            // --- End Placeholder ---
        });
    });

    // Function to populate the edit modal with product data
    const populateEditModal = (product) => {
        const form = document.getElementById('edit-product-form');
        
        form.querySelector('#edit-product-id').value = product._id;
        form.querySelector('#edit-product-name').value = product.name;
        form.querySelector('#edit-brand').value = product.brand;
        form.querySelector('#edit-description').value = product.description;
        form.querySelector('#edit-featured').checked = product.isFeatured;
        form.querySelector('#edit-status').checked = (product.status === 'Listed');

        // Clear old previews and variants
        const previewContainer = form.querySelector('#edit-image-preview');
        previewContainer.innerHTML = '';
        const variantList = form.querySelector('#edit-variant-list');
        variantList.innerHTML = '';

        // Add image previews (you'd also add a "remove" button for each)
        product.images.forEach(imageUrl => {
            // Note: This is a placeholder. You'll need a different
            // implementation to show previously uploaded images.
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'img-preview-wrapper';
            imgWrapper.innerHTML = `
                <img src="${imageUrl}" alt="Product Image" class="img-preview">
                <button type="button" class="remove-img-btn" data-image-name="${imageUrl}">&times;</button>
            `;
            previewContainer.appendChild(imgWrapper);
        });

        // Add existing variant forms
        product.variants.forEach((variant) => {
            addEditVariantForm(variant);
        });
        
        // Update total stock
        updateTotalStock('edit');
    };
    
    // Special function to add a variant form *with data*
    const addEditVariantForm = (variant) => {
        if (!variantTemplate) return;

        const variantList = document.getElementById('edit-variant-list');
        if (!variantList) return;

        const newVariant = variantTemplate.content.cloneNode(true);
        const variantCount = variantList.children.length + 1;

        // Update variant number
        newVariant.querySelector('.variant-number').textContent = variantCount;

        // --- Populate the form fields with existing data ---
        newVariant.querySelector('input[name="regularPrice"]').value = variant.regularPrice;
        newVariant.querySelector('input[name="salePrice"]').value = variant.salePrice;
        newVariant.querySelector('select[name="ram"]').value = variant.ram;
        newVariant.querySelector('select[name="storage"]').value = variant.storage;
        newVariant.querySelector('input[name="colour"]').value = variant.colour;
        newVariant.querySelector('input[name="stockQuantity"]').value = variant.stockQuantity;

        // Add event listeners
        newVariant.querySelector('.variant-stock').addEventListener('input', () => updateTotalStock('edit'));
        newVariant.querySelector('.btn-remove-variant').addEventListener('click', (e) => {
            e.currentTarget.closest('.variant-form-section').remove();
            updateVariantNumbers('edit');
            updateTotalStock('edit');
        });

        variantList.appendChild(newVariant);
    };

});