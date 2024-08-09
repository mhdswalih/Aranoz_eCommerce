 // List and unlist
  const ListButton = document.querySelectorAll('.list-btn');
  ListButton.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const categoryId = btn.getAttribute('data-id');
      const action = btn.textContent.trim() === 'Unlist' ? 'unlist' : 'list';

      Swal.fire({
        title: `Are you sure you want to ${action} this category?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Yes, ${action} it!`,
        cancelButtonText: 'Cancel',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch(`/admin/categories/unlist/${categoryId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const result = await response.json();
            if (result.success) {
              Swal.fire({
                title: 'Success!',
                text: `Category has been ${result.isUnlisted ? 'unlisted' : 'listed'} successfully.`,
                icon: 'success',
                confirmButtonText: 'OK',
              });
              btn.textContent = result.isUnlisted ? 'List' : 'Unlist';
            } else {
              Swal.fire({
                title: 'Error!',
                text: 'Failed to Unlist/List Category.',
                icon: 'error',
                confirmButtonText: 'OK',
              });
            }
          } catch (error) {
            console.error('Error:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to Unlist/List Category.',
              icon: 'error',
              confirmButtonText: 'OK',
            });
          }
        }
      });
    });
  });

  // soft delete delte 
  document.addEventListener('DOMContentLoaded', () => {
  const deleteButtons = document.querySelectorAll('.delete-category');

  deleteButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const categoryId = btn.getAttribute('data-id');

      Swal.fire({
        title: 'Are you sure you want to delete this category?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel',
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await fetch(`/admin/categories/softDelete/${categoryId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            const result = await response.json();
            if (result.success) {
              Swal.fire({
                title: 'Success!',
                text: 'Category has been deleted successfully.',
                icon: 'success',
                confirmButtonText: 'OK',
              }).then(() => {
                window.location.reload();
              });
            } else {
              Swal.fire({
                title: 'Error!',
                text: 'Failed to delete category.',
                icon: 'error',
                confirmButtonText: 'OK',
              });
            }
          } catch (error) {
            console.error('Error:', error);
            Swal.fire({
              title: 'Error!',
              text: 'Failed to delete category.',
              icon: 'error',
              confirmButtonText: 'OK',
            });
          }
        }
      });
    });
  });
});
