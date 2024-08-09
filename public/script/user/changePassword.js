document.getElementById('savePasswordChanges').addEventListener('click', async (event) => {
    event.preventDefault();

    const currpassword = document.getElementById('currpassword').value.trim();
    const newpassword = document.getElementById('newpassword').value.trim();
    const confirmpassword = document.getElementById('confirmpassword').value.trim();
    const err = document.getElementById('passwordChangeErr');

    const passwordRegex = /^.{8,}$/;

    if (newpassword !== confirmpassword) {
      err.innerHTML = "Passwords do not match";
      return;
    }

    if (!passwordRegex.test(newpassword)) {
      err.innerHTML = "New password must be at least 8 characters long";
      return;
    }

    err.innerHTML = "";

    const response = await fetch('/changePassword', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currpassword,
        newpassword
      })
    });

    if (response.ok) {
      $('#passwordchange').modal('hide');
      $('#successModalPassword').modal('show');
      setTimeout(() => {
        $('#successModalPassword').modal('hide');
      }, 3000);
    } else {
      const data = await response.json();
      err.innerHTML = data.message || "An error occurred";
    }
  });