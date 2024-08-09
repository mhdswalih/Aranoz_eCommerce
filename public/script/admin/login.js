document.getElementById("login").addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const submitError = document.getElementById("submitError"); 

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
      submitError.innerHTML = "Invalid email";
  } else {
      submitError.innerHTML = "";
      const response = await fetch("/admin/login", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
              email: email,
              password: password,
          }),
      });

      if (response.ok) {
          window.location.href = '/admin/home'; 
      } else {
          const data = await response.json();
          submitError.innerHTML = data.message; 
      }
  }
});
