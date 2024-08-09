let form = document.getElementById('AddCategory');
form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const submitError = document.getElementById('submitError');
    const Categoryname = document.getElementById('Categoryname').value;

    submitError.innerHTML = "";

    if (!Categoryname.trim()) {
        submitError.innerHTML = 'Invalid category';
        return;
    }

    try {
        const response = await fetch('/admin/AddCategories', {
            method: "POST",
            headers: {
                'Content-Type': "application/json",
            },
            body: JSON.stringify({ Categoryname })
        });

        if (response.ok) {
            window.location.href = "/admin/Categories";
        } else {
            const data = await response.json();
            submitError.innerHTML = data.message;
        }
    } catch (error) {
        submitError.innerHTML = 'Failed to add category. Please try again.';
    }
});
