document.getElementById('login').addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const submitError = document.getElementById('submit-error');

  

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^.{8,}$/;

    if (!emailRegex.test(email)) {
       return submitError.innerHTML = 'Invalid email';
     
    } else if (!passwordRegex.test(password)) {
       return submitError.innerHTML = 'Invalid password Password must be at least 8 characters long.';
      
    } else {
        submitError.innerHTML = "";
        try {
            const response = await fetch('/login', {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                })
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                const data = await response.json();
                submitError.innerHTML = data.message;
             
            }
        } catch (error) {
            submitError.innerHTML = 'An error occurred. Please try again.';
            console.error('Error:', error);
            
        }
    }
});
