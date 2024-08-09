document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.edit-address-link').forEach(link => {
    link.addEventListener('click', async (event) => {
      const addrId = event.currentTarget.getAttribute('data-addr-id');

      try {
        const response = await fetch(`/get-address/${addrId}`);
        if (response.ok) {
          const address = await response.json();

          document.getElementById('edit-name').value = address.name || '';
          document.getElementById('edit-phone').value = address.phone || '';
          document.getElementById('edit-addressLine1').value = address.addressLine1 || '';
          document.getElementById('edit-addressLine2').value = address.addressLine2 || '';
          document.getElementById('edit-city').value = address.city || '';
          document.getElementById('edit-state').value = address.state || '';
          document.getElementById('edit-zipcode').value = address.zipcode || '';

          document.getElementById('edit-address-id').value = addrId;
        } else {
          console.error('Failed to fetch address');
        }
      } catch (error) {
        console.error('Error fetching address:', error);
      }
    });
  });

  const editForm = document.getElementById('edit-address-form');
  const errorElement = document.getElementById('error');

  editForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('edit-name').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const addressLine1 = document.getElementById('edit-addressLine1').value.trim();
    const addressLine2 = document.getElementById('edit-addressLine2').value.trim();
    const city = document.getElementById('edit-city').value.trim();
    const state = document.getElementById('edit-state').value.trim();
    const zipcode = document.getElementById('edit-zipcode').value.trim();

    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^[1-9]\d{9}$/;
    const addressRegex = /^[a-zA-Z0-9\s,.-]+$/;
    const stateRegex = /^[a-zA-Z\s]+$/;
    const cityRegex = /^[a-zA-Z\s]+$/;
    const zipCodeRegex = /^\d{6}$/;

    let valid = true;
    let errorMsg = "";

    if (!nameRegex.test(name)) {
      errorMsg = "Invalid Name";
      valid = false;
    } else if (!phoneRegex.test(phone)) {
      errorMsg = "Invalid Phone Number";
      valid = false;
    } else if (!addressRegex.test(addressLine1)) {
      errorMsg = "Invalid Address Line 1";
      valid = false;
    } else if (!addressRegex.test(addressLine2)) {
      errorMsg = "Invalid Address Line 2";
      valid = false;
    } else if (!stateRegex.test(state)) {
      errorMsg = "Invalid State";
      valid = false;
    } else if (!cityRegex.test(city)) {
      errorMsg = "Invalid City";
      valid = false;
    } else if (!zipCodeRegex.test(zipcode)) {
      errorMsg = "Invalid Zip Code";
      valid = false;
    }

    if (!valid) {
      errorElement.textContent = errorMsg;
      return;
    }

    errorElement.textContent = "";

    const body = {
      addressId: document.getElementById('edit-address-id').value,
      name,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      zipcode
    };

    try {
      const response = await fetch('/edit-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        $('#EditAddressForm').modal('hide');
        $('#successModal1').modal('show');
        setTimeout(() => $('#successModal1').modal('hide'), 3000);
        setTimeout(() => location.reload(), 3000);
      } else {
        const data = await response.json();
        errorElement.textContent = data.message || 'An error occurred';
      }
    } catch (error) {
      console.error(error);
      errorElement.textContent = 'An error occurred while updating the address';
    }
  });
});
