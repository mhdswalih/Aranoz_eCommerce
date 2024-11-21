document.getElementById('signup').addEventListener('submit',async function(event){
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim()
    const name = document.getElementById('name').value.trim();
    const ref = document.getElementById('ref').value.trim()
    const phone = document.getElementById('phone').value.trim();
    const submitError = document.getElementById('submitError');
    const loader = document.getElementById("loader");
    const otpBtn = document.getElementById("get-otp-btn");

   

    const nameRegex = /^[a-zA-Z]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[1-9]\d{9}$/;
    const passwordRegex = /^.{8,}$/;

    if(password!==confirmPassword){
        return submitError.innerHTML = "Password do not match"
      }
    // if(!ref){
    //     return submitError.innerHTML = 'Invalid Referal Code'
    // }
    if(!nameRegex.test(name)){
        return submitError.innerHTML = 'Invalid name'       
    }else if(!passwordRegex.test(password)){
        return submitError.innerHTML = "Invalid Password"
    }else if (!emailRegex.test(email)){
        return submitError.innerHTML = "Invalid email"
    }else if (!phoneRegex.test(phone)){
        return submitError.innerHTML = 'Invalid phone'
    }else{
        // submitError.innerHTML ="";
        // loader.style.display = 'flex';
        // otpBtn.style.display = 'none'
    } 
        const response = await fetch ('/signup',{
            method : "POST",
            headers:{
                'Content-Type' :"application/json",
            },
            body :JSON.stringify({
                name:name,
                email:email,
                password:password,
                phone:phone,
                ref:ref
            })
        })
        if(response.ok){
            window.location.href ="/otp"
        }else{
            const data = await response.json();
            submitError.innerHTML = data.message
        }
    
})

function loadPage(){
    localStorage.clear()
}