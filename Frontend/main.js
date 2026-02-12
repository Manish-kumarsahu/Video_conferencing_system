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