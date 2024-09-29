function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    if (snackbar) {
      snackbar.textContent = message;
      snackbar.className = "show";
      setTimeout(function() { 
        snackbar.className = snackbar.className.replace("show", ""); 
      }, 3000); 
    } else {
      console.error('Snackbar element not found');
    }
  }

async function addToWish(button) {
    const productId = button.getAttribute('data-product-id');

    const quantity = 1;
  
    try {
      const response = await fetch('/add-wishList', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          productquantity: quantity,
        })
      });
  
      if (response.ok) {
        const data = await response.json()
        showSnackbar(data.message ||'Added to WishList');
      } else {
        showSnackbar('Failed to add to WishList');
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  // Attach event listener to all wish buttons
  document.querySelectorAll('.wish-button').forEach(button => {
    button.addEventListener('click', function() {
      addToWish(this);
    });
  });
  


