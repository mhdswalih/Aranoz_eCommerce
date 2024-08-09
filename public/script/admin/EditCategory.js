document.getElementById('EditCategory').addEventListener('submit', async (event) => {
    event.preventDefault();

    const Categoryname = document.getElementById('Categoryname').value.trim();
    const CategoryId = document.getElementById('categoryId').value;
    console.log(CategoryId)

    // Show a confirmation dialog
    const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to update this category?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!'
    });

    if (confirmation.isConfirmed) {
        // Send the update request
        try {
            const response = await fetch('/admin/editCategory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Categoryname, CategoryId }),
            });

            const data = await response.json();

            if (response.ok) {
                // Show success message
                await Swal.fire({
                    title: 'Updated!',
                    text: 'Category has been updated.',
                    icon: 'success'
                });
                window.location.href = '/admin/Categories';
            } else {
                // Show error message
                Swal.fire({
                    title: 'Error!',
                    text: data.message || 'There was an error updating the category.',
                    icon: 'error'
                });
            }
        } catch (error) {
            // Show error message
            Swal.fire({
                title: 'Error!',
                text: 'There was an error updating the category.',
                icon: 'error'
            });
        }
    }
});
