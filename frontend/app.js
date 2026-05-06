// Base URL for the FastAPI backend
const API_BASE = "http://127.0.0.1:8000";

// Handle PIN Box focus shifting in retrieve.html
const pinBoxes = document.querySelectorAll('.pin-box');
if (pinBoxes.length > 0) {
    pinBoxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < pinBoxes.length - 1) {
                pinBoxes[index + 1].focus();
            }
        });
        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                pinBoxes[index - 1].focus();
            }
        });
    });
}

// Handle Request Locker Form Submission
const requestForm = document.getElementById('requestForm');
if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const studentId = document.getElementById('studentID').value;
        const lockerId = document.getElementById('lockerID').value;
        const msgElement = document.getElementById('request-message');
        
        try {
            const response = await fetch(`${API_BASE}/parcels/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentID: studentId,
                    lockerID: parseInt(lockerId),
                    parcelPIN: Math.floor(1000 + Math.random() * 9000).toString(),
                    hasPenalty: false
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Hide form and show success
                document.getElementById('request-box').style.display = 'none';
                document.getElementById('success-box').style.display = 'block';
                
                document.getElementById('display-locker').innerText = data.lockerID;
                document.getElementById('display-pin').innerText = data.parcelPIN;
            } else {
                msgElement.innerText = data.detail || "Error assigning locker.";
                msgElement.style.color = "red";
            }
        } catch (error) {
            console.error("Error:", error);
            msgElement.innerText = "Network error connecting to server.";
        }
    });
}

// Handle Retrieve Locker PIN Submission
const retrieveForm = document.getElementById('retrieveForm');
if (retrieveForm) {
    retrieveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Combine the 4 pin boxes
        const boxes = document.querySelectorAll('.pin-box');
        let pin = "";
        boxes.forEach(box => pin += box.value);
        
        const msgElement = document.getElementById('retrieve-message');
        
        if (pin.length !== 4) {
            msgElement.innerText = "Please enter a 4-digit PIN.";
            return;
        }

        try {
            msgElement.innerText = "Verifying...";
            msgElement.style.color = "white";

            const response = await fetch(`${API_BASE}/verify/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    generated_pin: pin
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                msgElement.innerText = `Success! Opened.`;
                msgElement.style.color = "green";
                // Optionally clear the inputs
                boxes.forEach(box => box.value = '');
                boxes[0].focus();
            } else {
                msgElement.innerText = data.detail || "Invalid or Expired PIN.";
                msgElement.style.color = "red";
            }
        } catch (error) {
            console.error("Error:", error);
            msgElement.innerText = "Network error connecting to server.";
            msgElement.style.color = "red";
        }
    });
}

// Handle Registration
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const studentID = document.getElementById('regStudentID').value;
        const email = document.getElementById('regEmail').value;
        const phone = document.getElementById('regPhone').value;
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirmPassword').value;
        const msg = document.getElementById('regMessage');

        if (password !== confirm) {
            msg.innerText = "Passwords do not match.";
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, studentID, email, phoneNo: phone, password })
            });
            const data = await response.json();
            if (response.ok) {
                alert("Registration successful! Redirecting to login...");
                window.location.href = "login.html";
            } else {
                msg.innerText = data.detail || "Registration failed.";
            }
        } catch (err) {
            msg.innerText = "Network error.";
        }
    });
}

// Handle Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const msg = document.getElementById('loginMessage');

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('userName', data.name);
                window.location.href = "request.html";
            } else {
                msg.innerText = data.detail || "Login failed.";
            }
        } catch (err) {
            msg.innerText = "Network error.";
        }
    });
}
