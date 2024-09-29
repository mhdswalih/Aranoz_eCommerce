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

// async function addToCart(button) {
//   const productId = button.getAttribute('data-product-id');
//   const userId = button.getAttribute('data-user-id');
//   const quantity = 1;

//   try {
//     const response = await fetch('/cart', {
//       method: "POST",
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ productId, userId, productquantity: quantity })
//     });

//     if (response.ok) {
//       showSnackbar('Added to cart');
//     } else {
//       showSnackbar('Failed to add to cart');
//     }
//   } catch (error) {
//     console.log(error);
//     showSnackbar('Error adding to cart');
//   }
// }

async function removeFromCart(productId) {
  try {
    const response = await fetch('/removeCart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });

    if (response.ok) {
      showSnackbar('Removed from cart');
      setTimeout(() => window.location.reload(), 3500); 
    } else {
      showSnackbar('Failed to remove from cart');
    }
  } catch (error) {
    console.error('Error:', error);
    showSnackbar('Error removing from cart');
  }
}

async function incrementCount(productId) {
  console.log(productId);
  
  try {
    const response = await fetch('/stockInc', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });

    if (response.ok) {
      const result = await response.json();
      const quantityInput = document.getElementById(`quantity-${productId}`);
      quantityInput.value = result.newQuantity; 
       
      showSnackbar(result.message||'Increment successful');
      setTimeout(() => location.reload(), 3500);
    } else {
      showSnackbar('Failed to increment');
    }
  } catch (error) {
    console.log(error);
    showSnackbar('Error incrementing stock');
  }
}

async function decrementCount(productId) {
  try {
    const response = await fetch('/stockDec', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });

    if (response.ok) {
      const result = await response.json();
      const quantityInput = document.getElementById(`quantity-${productId}`);
      quantityInput.value = result.newQuantity; 
      showSnackbar('Decrement successful');
      setTimeout(() => location.reload(), 3500);
    } else {
      const data = await response.json();
      showSnackbar('Failed to decrement: ' + data.message);
    }
  } catch (error) {
    console.log(error);
    showSnackbar('Error decrementing stock');
  }
}
