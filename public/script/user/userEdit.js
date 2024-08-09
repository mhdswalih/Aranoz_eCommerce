let currName;
let currEmail;
let currPhone;

// Select DOM elements
const name = document.getElementById("name");
const email = document.getElementById("email");
const phone = document.getElementById("phone");
const submitError = document.getElementById("editErr");

// Initialize current values
document.addEventListener("DOMContentLoaded", function() {
  currName = name.value.trim();
  currEmail = email.value.trim();
  currPhone = phone.value.trim();
});

// Form submission handler
document.getElementById("saveProfileChanges").addEventListener("click", async function(event) {
  event.preventDefault();

  // Validation regex patterns
  const nameRegex = /^[A-Za-z][A-Za-z\s]*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[1-9]\d{9}$/;

  // Validation checks
  if (!nameRegex.test(name.value.trim())) {
    submitError.textContent = "Please enter a valid name";
    return;
  } 
  if (!emailRegex.test(email.value.trim())) {
    submitError.textContent = "Invalid email";
    return;
  } 
  if (!phoneRegex.test(phone.value.trim())) {
    submitError.textContent = "Invalid phone number";
    return;
  } 

  submitError.textContent = ""; // Clear previous errors

  // Create request body
  const body = {};
  if (currName !== name.value.trim()) {
    body.name = name.value.trim();
  }
  if (currEmail !== email.value.trim()) {
    body.email = email.value.trim();
  }
  if (currPhone !== phone.value.trim()) {
    body.phone = phone.value.trim();
  }
  body.userId = document.getElementById('userEdit').getAttribute('data-user-id');

  try {
    // Send data to the server
    const response = await fetch("/Profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    // Handle server response
    if (response.ok) {
      $('#editProfileModal').modal('hide');
      $('#successModal').modal('show');
      setTimeout(() => $('#successModal').modal('hide'), 3000);
      setTimeout(() => location.reload(), 3000);
    } else {
      const data = await response.json();
      if (response.status === 400) {
        submitError.textContent = data.message;
      } else if (response.status === 404) {
        submitError.textContent = "User not found";
      } else {
        submitError.textContent = "An error occurred while updating the profile";
      }
    }
  } catch (error) {
    console.error('Error:', error);
    submitError.textContent = "An unexpected error occurred. Please try again later.";
  }
});