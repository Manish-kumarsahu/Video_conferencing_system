function goToJoin() {
    window.location.href = "join.html";
}

function joinMeeting() {
    const username = document.getElementById("username").value;
    const meetingId = document.getElementById("meetingId").value;

    if (username && meetingId) {
        window.location.href =
            `meeting.html?username=${username}&meetingId=${meetingId}`;
    } else {
        alert("Please fill all fields");
    }
}
// ===== REGISTER =====
function registerUser() {
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    if (email && password) {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userPassword", password);
        alert("Registration successful!");
        window.location.href = "login.html";
    } else {
        alert("Please fill all fields");
    }
}

// ===== LOGIN =====
function loginUser() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const savedEmail = localStorage.getItem("userEmail");
    const savedPassword = localStorage.getItem("userPassword");

    if (email === savedEmail && password === savedPassword) {
        alert("Login successful!");
        window.location.href = "index.html";
    } else {
        alert("Invalid email or password");
    }
}