document.addEventListener('DOMContentLoaded', function () {
    const addressRadios = document.querySelectorAll('input[name="selectedAddress"]');
    const selectedAddressDiv = document.getElementById('selectedAddress');

    // Update selected address display when a radio button is checked
    addressRadios.forEach(function (radio) {
        radio.addEventListener('change', function () {
            if (this.checked) {
                selectedAddressDiv.innerHTML = `<div>${this.getAttribute('data-address')}</div>`;
            }
        });
    });

    // Trigger the change event for the initially checked radio button
    const checkedRadio = document.querySelector('input[name="selectedAddress"]:checked');
    if (checkedRadio) {
        checkedRadio.dispatchEvent(new Event('change'));
    }
});

document.getElementById('orderForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const shippingAddress = document.querySelector('input[name="selectedAddress"]:checked').value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    const requestBody = {
        shippingAddress,
        paymentMethod,
    };

    console.log("Order Request Body:", requestBody);

    try {
        const response = await fetch('/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        if (response.ok) {
            // Show modal with animation
            const modal = document.getElementById('orderPlacedModal');
            const modalContent = document.querySelector('.modal-content');
            modal.style.display = 'block';
            modal.classList.add('show');
            modalContent.classList.add('show');
            modal.querySelector('#okButton').addEventListener('click', () => {
                modalContent.classList.remove('show');
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('An error occurred. Please try again.');
    }
});

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
    const modal = document.getElementById('orderPlacedModal');
    if (event.target === modal) {
        const modalContent = document.querySelector('.modal-content');
        modalContent.classList.remove('show');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
});
