document.addEventListener('DOMContentLoaded', () => {
    const toggleButtons = document.querySelectorAll('.toggle-details');
    toggleButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const index = btn.getAttribute('data-index');
            const detailsRow = document.getElementById(`details-${index}`);
            detailsRow.style.display = (detailsRow.style.display === 'none' || detailsRow.style.display === '') ? 'table-row' : 'none';
        });
    });

    // Block/unblock user functionality
    const blockButtons = document.querySelectorAll('.block-user');
    blockButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const userId = btn.getAttribute('data-id');
            const action = btn.textContent.trim() === 'Block' ? 'block' : 'unblock';

            Swal.fire({
                title: `Are you sure you want to ${action} this user?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: `Yes, ${action} them!`,
                cancelButtonText: 'Cancel',
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`/admin/Users/block/${userId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        const result = await response.json();
                        if (result.success) {
                            Swal.fire({
                                title: 'Success!',
                                text: `User has been ${result.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
                                icon: 'success',
                                confirmButtonText: 'OK'
                            });
                            btn.textContent = result.isBlocked ? 'Unblock' : 'Block';
                        } else {
                            Swal.fire({
                                title: 'Error!',
                                text: 'Failed to block/unblock user.',
                                icon: 'error',
                                confirmButtonText: 'OK'
                            });
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        Swal.fire({
                            title: 'Error!',
                            text: 'Failed to block/unblock user.',
                            icon: 'error',
                            confirmButtonText: 'OK'
                        });
                    }
                }
            });
        });
    });
});
