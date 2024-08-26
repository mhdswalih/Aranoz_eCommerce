document.addEventListener('DOMContentLoaded', function () {

    function addressM(){
        const amodal = document.getElementById('addressModal');
        if(amodal.style.display === 'none'){
            amodal.style.display = 'block'
        } else {
            amodal.style.display = 'none'
        }
    }
    const addressRadios = document.querySelectorAll('input[name="selectedAddress"]');
    const selectedAddressDiv = document.getElementById('selectedAddress');

    addressRadios.forEach(function (radio) {
        radio.addEventListener('change', function () {
            if (this.checked) {
                selectedAddressDiv.innerHTML = `<div>${this.getAttribute('data-address')}</div>`;
            }
        });
    });

    // Set the initially selected address if any
    const checkedRadio = document.querySelector('input[name="selectedAddress"]:checked');
    if (checkedRadio) {
        checkedRadio.dispatchEvent(new Event('change'));
    }
});

document.getElementById('orderForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Get selected shipping address and payment method
    const shippingAddress = document.querySelector('input[name="selectedAddress"]:checked').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Create request body
    const requestBody = {
        shippingAddress,
        paymentMethod,
    };

    console.log("Order Request Body:", requestBody);

    try {
        // Send POST request to server
        const response = await fetch('/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
    
        // Parse and handle server response
        const data = await response.json();
        console.log(data);
        
        if (data.success) {
            // Show SweetAlert for success
            Swal.fire({
                title: 'Order Placed!',
                text: 'Your order has been placed successfully.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            // Show SweetAlert for error
            Swal.fire({
                text: data.message,
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        // Show SweetAlert for fetch or JSON parsing errors
        console.error('Error placing order:', error);
        Swal.fire({
            title: 'Error!',
            text: 'An error occurred. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    }


});


