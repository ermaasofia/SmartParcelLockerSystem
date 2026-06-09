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
        const parcelId = document.getElementById('parcelID').value;
        const reqDate = document.getElementById('date').value;
        const msgElement = document.getElementById('request-message');

        try {
            const response = await fetch(`${API_BASE}/requests/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    studentID: studentId,
                    parcelID: parseInt(parcelId) || null,
                    reqDate: reqDate
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Hide form and show success
                document.getElementById('request-box').style.display = 'none';
                document.getElementById('success-box').style.display = 'block';

                document.getElementById('success-box').innerHTML = `
                    <h2>REQUEST SUBMITTED</h2>
                    <p style="margin-bottom: 20px;">Your request for Parcel <strong>${parcelId}</strong> on <strong>${reqDate}</strong> has been submitted to the staff.</p>
                    <p style="font-size: 0.9rem; color: #aaa;">Please wait for approval of your request. Further updates will be sent via email.</p>
                    <a href="index.html" class="btn" style="margin-top: 20px;">DONE</a>
                `;
            } else {
                msgElement.innerText = data.detail || "Error submitting request.";
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
    let failedAttempts = parseInt(sessionStorage.getItem('pinAttempts') || '0');

    // Check initially if already blocked
    if (failedAttempts >= 3) {
        const msgElement = document.getElementById('retrieve-message');
        const emergencyBtn = document.getElementById('emergency-btn');
        if (msgElement) {
            msgElement.innerText = "Unsuccessful notice: Too many failed attempts. Please use the emergency form.";
            msgElement.style.color = "red";
        }
        if (emergencyBtn) emergencyBtn.style.display = 'block';
        const submitBtn = retrieveForm.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;
    }

    retrieveForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Combine the 4 pin boxes
        const boxes = document.querySelectorAll('.pin-box');
        let pin = "";
        boxes.forEach(box => pin += box.value);

        const msgElement = document.getElementById('retrieve-message');
        const emergencyBtn = document.getElementById('emergency-btn');

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
                failedAttempts = 0;
                sessionStorage.setItem('pinAttempts', '0');
                if (emergencyBtn) emergencyBtn.style.display = 'none';
                retrieveForm.querySelector('button[type="submit"]').disabled = false;
            } else {
                failedAttempts++;
                sessionStorage.setItem('pinAttempts', failedAttempts);
                if (failedAttempts >= 3) {
                    msgElement.innerText = "Unsuccessful notice: Too many failed attempts. Please use the emergency form.";
                    msgElement.style.color = "red";
                    if (emergencyBtn) emergencyBtn.style.display = 'block';
                    retrieveForm.querySelector('button[type="submit"]').disabled = true;
                } else {
                    msgElement.innerText = data.detail || "Invalid or Expired PIN.";
                    msgElement.style.color = "red";
                }
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
