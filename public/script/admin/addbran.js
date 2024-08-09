document.getElementById('AddBrands').addEventListener('submit', async function(event) {
    event.preventDefault();

    const submitError = document.getElementById('submitError');
    const Brandname = document.getElementById('Brandname').value;
    // const productimage = document.getElementById('productimage').value;

    const response = await fetch('/admin/addBrands', {
        method: "POST",
        headers: {
            'Content-Type': "application/json",
        },
        body: JSON.stringify({
            Brandname: Brandname,

        })
    });

    if (response.ok) {
        window.location.href = "/admin/Brands"; 
    } else {
        const data = await response.json();
        submitError.innerHTML = data.message; 
    }
});



