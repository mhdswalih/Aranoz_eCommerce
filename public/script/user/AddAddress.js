document.getElementById('saveAddressAdd').addEventListener('click', async (event) => {
  event.preventDefault();

  const name = document.getElementById('newName').value.trim();
  const phone = document.getElementById('newPhoneNumber').value.trim();
  const address1 = document.getElementById('newAddressLine1').value.trim();
  const address2 = document.getElementById('newAddressLine2').value.trim();
  const state = document.getElementById('newState').value.trim();
  const city = document.getElementById('newCity').value.trim();
  const zipcode = document.getElementById('newZipCode').value.trim();
  const err = document.getElementById('Error');

  const nameregex = /^[a-zA-Z\s]+$/;
  const phoneRegex = /^[1-9]\d{9}$/;
  const addressRegex1 = /^[a-zA-Z0-9\s,.-]+$/;
  const addressRegex2 = /^[a-zA-Z0-9\s,.-]+$/;
  const stateRegex = /^[a-zA-Z\s]+$/;
  const cityRegex = /^[a-zA-Z\s]+$/;
  const zipCodeRegex = /^\d{6}$/;

  if (!nameregex.test(name)) {
    err.innerHTML = "Invalid Name";
  } else if (!phoneRegex.test(phone)) {
    err.innerHTML = "Invalid Phone Number";
  } else if (!addressRegex1.test(address1)) {
    err.innerHTML = "Invalid Address 1";
  } else if (!addressRegex2.test(address2)) {
    err.innerHTML = "Invalid Address 2";
  } else if (!stateRegex.test(state)) {
    err.innerHTML = "Invalid State";
  } else if (!cityRegex.test(city)) {
    err.innerHTML = "Invalid City";
  } else if (!zipCodeRegex.test(zipcode)) {
    err.innerHTML = "Invalid Zip Code";
  } else {
    err.innerHTML = "";

    try {
      const response = await fetch('/add-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newName: name,
          newPhoneNumber: phone,
          newAddressLine1: address1,
          newAddressLine2: address2,
          newCity: city,
          newState: state,
          newZipCode: zipcode
        })
      });

      if (response.ok) {
        $('#addAddressModal').modal('hide');
        $('#successModal').modal('show');
        setTimeout(() => {
          $('#successModal').modal('hide');
          location.reload();
        }, 3000);
      } else {
        const data = await response.json();
        err.innerHTML = data.message || "An error occurred while adding the address";
      }
    } catch (error) {
      err.innerHTML = "An error occurred while adding the address";
    }
  }
});

//soft delte address

document.addEventListener('DOMContentLoaded', () => {
let addressId;
  document.getElementById('address-container').addEventListener('click', (event) => {
    if(event.target.classList.contains('delete-btn')){
      event.preventDefault();
      addressId = event.target.getAttribute('data-addr-id');
      $('#DeleteAddressModal').modal('show');
    }
  })

  document.getElementById('confirmDeleteAddress').addEventListener('click', async () => {
    try{
      const response = await fetch(`/deleteAdd/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        $('#DeleteAddressModal').modal('hide');
        $('#successModald').modal('show');
        setTimeout(() => {
          $('#successModald').modal('hide');
          location.reload();
        }, 3000);
      } else {
        const result = await response.json();
        err.innerHTML=result.message || 'Failed to delete address.';
      }
    }catch(err){
      console.log(err)
    }
  })
});

