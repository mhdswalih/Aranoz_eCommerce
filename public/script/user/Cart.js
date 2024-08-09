const { json } = require("body-parser");

async function addToCart(button) {
    const productId = button.getAttribute('data-product-id');
    const userId = button.getAttribute('data-user-id');
  
    const quantity = 1;
  
    try {
      const response = await fetch('/cart', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          userId,
          productquantity: quantity,
        
        })
      });
  
      if (response.ok) {
        alert('Added to cart');
      } else {
        alert('Failed to add to cart');
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  document.querySelector('#add_cart').addEventListener('click', function() {
    addToCart(this);
  });
  

  //removefromCart

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
        alert('Removed from cart');
        window.location.reload(); 
      } else {
        alert('Failed to remove from cart');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

//increament stock 

async function incrementCount(productId) {
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
        alert('Increment successful');
        setTimeout(() => {
            location.reload()
        },500)
      } else {
        alert('Failed to increment');
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  //stock Dec
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
        setTimeout(() => {
            location.reload()
        },500)
        alert('Decrement successful');
      } else {
        alert('Failed to decrement');
      }
    } catch (error) {
      console.log(error);
    }
  }
  

  