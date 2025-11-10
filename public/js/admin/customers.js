document.addEventListener('DOMContentLoaded', () => {

    // Find all the block/unblock toggles on the page
    const blockToggles = document.querySelectorAll('.block-toggle');

    blockToggles.forEach(toggle => {
        toggle.addEventListener('change', (event) => {
            
            const customerId = event.target.dataset.customerId;
            
            // The 'checked' state means the user is ACTIVE.
            // Therefore, 'isBlocked' is the opposite of the 'checked' state.
            const isBlocked = !event.target.checked;

            if (isBlocked) {
                console.log(`Sending API call to BLOCK customer: ${customerId}`);
                // You can also show a confirmation modal here
            } else {
                console.log(`Sending API call to UNBLOCK customer: ${customerId}`);
            }

            // =======================================================
            // TODO: This is where you'll send the request to your backend
            // =======================================================
            /*
            // Example using fetch:
            fetch(`/admin/customers/toggle-block/${customerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isBlocked: isBlocked })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Customer status updated successfully');
                    // Optionally, reload the page or update the status badge text
                    // location.reload(); 
                } else {
                    console.error('Failed to update status');
                    // Revert the toggle if the API call failed
                    event.target.checked = !isBlocked;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                // Revert the toggle if the API call failed
                event.target.checked = !isBlocked;
            });
            */
            // =======================================================

        });
    });
});