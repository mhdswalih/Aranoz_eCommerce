document.getElementById('otp-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const submitError = document.getElementById('submitError');
    const otpInputs = document.querySelectorAll('.otp-input');
    let emailOtp = '';

    otpInputs.forEach(input => emailOtp += input.value.trim());

    if (emailOtp.length < 6) {
        submitError.innerHTML = "Please enter a valid OTP";
        return;
    } else {
        submitError.innerHTML = '';
    }

    try {
        const response = await fetch('/verify-otp', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ otp: emailOtp }),
        });

        if (response.ok) {
            window.location.href = "/login";
        } else {
            const data = await response.json();
            submitError.innerHTML = data.message;
        }
    } catch (error) {
        console.error('Error:', error);
        submitError.innerHTML = "An error occurred while verifying the OTP";
    }
});

document.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
    input.addEventListener('keyup', (e) => {
        if (e.target.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }

        if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
            inputs[index - 1].focus();
        }
    });

    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const pastedData = paste.slice(0, inputs.length);
        for (let i = 0; i < pastedData.length; i++) {
            inputs[i].value = pastedData[i];
        }

        const lastFilledIndex = pastedData.length - 1;
        if (lastFilledIndex < inputs.length - 1) {
            inputs[lastFilledIndex + 1].focus();
        }
    });
});

document.getElementById('resend-otp').addEventListener('click', async function () {
    const email = document.getElementById('user-email').innerText
    const submitError = document.getElementById('submitError');
    const timerSection = document.getElementById('timerSection');
    const timer = document.getElementById('timer');
    const resendOTPButton = document.getElementById('resend-otp');
  
    console.log(`Resending OTP to ${email}`);
  
    try {
      const response = await fetch('/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });
  
      if (response.ok) {
        submitError.innerHTML = "OTP has been resent";
        startTimer();
      } else {
        const data = await response.json();
        submitError.innerHTML = data.message || 'Failed to resend OTP. Please try again.';
      }
    } catch (error) {
      console.error('Error:', error);
      submitError.innerHTML = "An error occurred. Please try again";
    }
  
    function startTimer() {
      let timerDuration = 60;
      timerSection.style.display = 'block';
      resendOTPButton.style.display = 'none';
  
      const interval = setInterval(async() => {
        if (timerDuration <= 0) {
          clearInterval(interval);
          resendOTPButton.style.display = 'block';
          timerSection.style.display = 'none';
          localStorage.clear()
          await  fetch()
        } else {
          localStorage.setItem('time',timerDuration)
          timer.textContent = timerDuration;
          timerDuration--;
        }
      }, 1000);
    }
  });

  function loadPage(){

    const timerSection = document.getElementById('timerSection');
    const timer = document.getElementById('timer');
    const resendOTPButton = document.getElementById('resend-otp');
    
    const time = localStorage.getItem('time')

    if(time!=null){
        let duration = Number(time)
        timerSection.style.display = 'block';
        resendOTPButton.style.display = 'none';
        const interval = setInterval(async() => {
            if (duration <= 0) {
              clearInterval(interval);
              resendOTPButton.style.display = 'block';
              timerSection.style.display = 'none';
              localStorage.clear()
              await  fetch()
            } else {
              localStorage.setItem('time',duration)
              timer.innerHTML = duration;
              duration--;
            }
          }, 1000);
    }else{
        let timerDuration = 60;
      timerSection.style.display = 'block';
      resendOTPButton.style.display = 'none';
  
      const interval = setInterval(async() => {
        if (timerDuration <= 0) {
          clearInterval(interval);
          resendOTPButton.style.display = 'block';
          timerSection.style.display = 'none';
          localStorage.clear()
          await  fetch()
        } else {
          localStorage.setItem('time',timerDuration)
          timer.textContent = timerDuration;
          timerDuration--;
        }
      }, 1000);
    }
  }
  