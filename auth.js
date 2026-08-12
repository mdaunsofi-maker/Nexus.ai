const CLIENT_ID = '466660359233-3oe2al1fdo7tp9unoki1v048ioak4hh7.apps.googleusercontent.com';
let currentIdentifier = "";

const BACKEND_URL = 'https://nexus-ai-yh3t.onrender.com';

// 1. Send Email OTP
async function sendEmailOtp() {
    const email = document.getElementById("emailInput").value.trim();
    if (!email || !email.includes('@')) {
        alert("Please enter a valid email address.");
        return;
    }
    currentIdentifier = email;
    triggerOtpRequest(`${BACKEND_URL}/api/send-email-otp`, { email });
}

// 2. Send Mobile OTP
async function sendPhoneOtp() {
    const phone = document.getElementById("phoneInput").value.trim();
    if (!phone) {
        alert("Please enter your mobile number.");
        return;
    }
    currentIdentifier = phone;
    triggerOtpRequest(`${BACKEND_URL}/api/send-phone-otp`, { phone });
}

// Helper Request Handler
async function triggerOtpRequest(url, data) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();

        if (result.success) {
            document.getElementById("sentTarget").innerText = currentIdentifier;
            document.getElementById("authStep1").classList.add("hidden");
            document.getElementById("authStep2").classList.remove("hidden");
        } else {
            alert(result.message);
        }
    } catch (err) {
        alert("Server connection error.");
    }
}

// 3. Verify OTP Function
async function verifyOtp() {
    const enteredOtp = document.getElementById("otpInput").value.trim();
    if (!enteredOtp) {
        alert("Please enter the OTP.");
        return;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: currentIdentifier, otp: enteredOtp })
        });
        const data = await res.json();

        if (data.success) {
            let username = currentIdentifier.includes('@') 
                ? currentIdentifier.split("@")[0] 
                : "User_" + currentIdentifier.slice(-4);
            username = username.charAt(0).toUpperCase() + username.slice(1);

            localStorage.setItem("nexus_logged_in", "true");
            localStorage.setItem("nexus_user", username);
            window.location.href = "index.html";
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Verification failed due to server error.");
    }
}

function backToStep1() {
    document.getElementById("otpInput").value = "";
    document.getElementById("authStep2").classList.add("hidden");
    document.getElementById("authStep1").classList.remove("hidden");
}

// 4. Google OAuth Setup with Retry/Delay
function handleGoogleLogin() {
    if (typeof google === 'undefined') {
        setTimeout(handleGoogleLogin, 500);
        return;
    }
    
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse
    });
    
    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const btnContainer = document.getElementById("googleBtnContainer");
            if (btnContainer) {
                google.accounts.id.renderButton(btnContainer, { 
                    theme: "filled_black", 
                    size: "large", 
                    width: "100%" 
                });
            }
        }
    });
}

function handleCredentialResponse(response) {
    const responsePayload = parseJwt(response.credential);
    const email = responsePayload.email;
    const name = responsePayload.name;

    localStorage.setItem("nexus_logged_in", "true");
    localStorage.setItem("nexus_user", name);
    localStorage.setItem("nexus_email", email);
    
    window.location.href = "index.html";
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

window.onload = function () {
    handleGoogleLogin();
};

async function resendOtp() {
    if (!currentIdentifier) {
        alert("Please enter your email first.");
        backToStep1();
        return;
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/send-email-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentIdentifier })
        });
        const result = await res.json();

        if (result.success) {
            alert("A new OTP has been sent to your email!");
        } else {
            alert(result.message);
        }
    } catch (err) {
        alert("Failed to resend OTP. Server connection error.");
    }
}